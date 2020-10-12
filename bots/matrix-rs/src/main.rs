use matrix_sdk::{
    events::{
        room::member::MemberEventContent,
        room::message::{MessageEventContent, TextMessageEventContent},
        AnyMessageEventContent, StrippedStateEvent, SyncMessageEvent,
    },
    Client, ClientConfig, EventEmitter, Session, SyncRoom, SyncSettings,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use structopt::StructOpt;

use async_trait::async_trait;
use std::convert::Infallible;
use std::fs;
use std::net::SocketAddr;
use url::Url;

#[derive(Debug, StructOpt)]
#[structopt(
    name = "rcj-notification-bot",
    about = "Matrix bot to notify teams during the competition."
)]
struct Opt {
    /// Config file
    #[structopt(short, long, parse(from_os_str), default_value = "matrix-bot.json")]
    config: PathBuf,

    /// Port to listen on for BotManager callbacks
    // we don't want to name it "speed", need to look smart
    #[structopt(short = "l", long = "listen-address", default_value = "127.0.0.1:2001")]
    listen_address: SocketAddr,
}

#[derive(Deserialize, Serialize, Debug)]
struct UserCredentials {
    user_id: String,
    password: String,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(untagged)]
enum UserAuth {
    Session(Session),
    Login(UserCredentials),
}

#[derive(Deserialize, Serialize, Debug)]
struct Config {
    user: UserAuth,
    homeserver: String,
}

#[derive(Debug, Clone)]
struct RcjMatrixBot {
    client: Client,
}

impl RcjMatrixBot {
    fn new(client: Client) -> Self {
        RcjMatrixBot { client }
    }
}

use tokio::time::{delay_for, Duration};

#[async_trait]
impl EventEmitter for RcjMatrixBot {
    // autojoining
    async fn on_stripped_state_member(
        &self,
        room: SyncRoom,
        room_member: &StrippedStateEvent<MemberEventContent>,
        _: Option<MemberEventContent>,
    ) {
        // unwrap is ok, since we initialized the client
        if room_member.state_key != self.client.user_id().await.unwrap() {
            return;
        }
        if let SyncRoom::Invited(room) = room {
            let room = room.read().await;
            println!("Autojoining room {}", room.room_id);
            let mut delay = 2;
            while let Err(err) = self.client.join_room_by_id(&room.room_id).await {
                // retry autojoin due to synapse sending invites, before the invited user can join
                // for more information see https://github.com/matrix-org/synapse/issues/4345
                eprintln!(
                    "Failed to join room {} ({:?}), retrying in {}s",
                    room.room_id, err, delay
                );
                delay_for(Duration::from_secs(delay)).await;
                delay *= 2;
                if delay > 3600 {
                    eprintln!("Can't join room {} ({:?})", room.room_id, err);
                    break;
                }
            }
            println!("Successfully joined room {}", room.room_id);
        }
    }

    async fn on_room_message(&self, room: SyncRoom, event: &SyncMessageEvent<MessageEventContent>) {
        if let SyncRoom::Joined(room) = room {
            let (msg_body, sender) = if let SyncMessageEvent {
                content: MessageEventContent::Text(TextMessageEventContent { body: msg_body, .. }),
                sender,
                ..
            } = event
            {
                (msg_body.clone(), sender)
            } else {
                return;
            };

            if sender == &self.client.user_id().await.unwrap() {
                return;
            }

            // we clone here to hold the lock as little time as possible.
            let room_id = room.read().await.room_id.clone();

            let msg = msg_body.split_whitespace();
            let msg_normalized = msg.fold(String::new(), |mut s, el| { s.push_str(el); s });
            println!("> {}: {}", &room_id, msg_normalized);

            if msg_body.starts_with("!echo ") {
                let response = &msg_body[6..];
                let content = AnyMessageEventContent::RoomMessage(MessageEventContent::Text(
                    TextMessageEventContent {
                        body: response.to_string(),
                        formatted: None,
                        relates_to: None,
                    },
                ));

                println!("{}: {}", &room_id, response);

                if let Err(err) = self.client.room_send(&room_id, content, None).await {
                    eprintln!("{} Failed to send message: {:?}", &room_id, err);
                }
            }
        }
    }
}

async fn listen_matrix(client: Client) {
    let mut client = client;
    // login
    client
        .add_event_emitter(Box::new(RcjMatrixBot::new(client.clone())))
        .await;

    client.sync(SyncSettings::default().full_state(false)).await;
}

use ruma::RoomId;
use std::convert::TryFrom;
use warp::{Filter, Reply};

async fn index(data: RcjMatrixBot) -> Result<impl Reply, Infallible> {
    let user_id = data.client.user_id().await;
    let user_id = user_id
        .as_ref()
        .map(|id| id.as_str())
        .unwrap_or("undefined");

    let message = "Hallo Welt! :D";

    let content =
        AnyMessageEventContent::RoomMessage(MessageEventContent::Text(TextMessageEventContent {
            body: message.to_owned(),
            formatted: None,
            relates_to: None,
        }));

    let room_id = RoomId::try_from("!FbwAWnZrdbeccOIHEo:tchncs.de").unwrap();

    if let Err(err) = data.client.room_send(&room_id, content, None).await {
        Ok(format!("Failed to send message: {:?}", err))
    } else {
        Ok(format!("{}: {}", user_id, message))
    }
}

fn with_data(
    client: RcjMatrixBot,
) -> impl Filter<Extract = (RcjMatrixBot,), Error = Infallible> + Clone {
    warp::any().map(move || client.clone())
}

#[tokio::main]
async fn main() {
    let opt = Opt::from_args();
    let config = fs::read_to_string(&opt.config).expect("Failed to open config file");
    let mut config: Config = serde_json::from_str(&config).expect("Failed to parse config file");

    // create data directory
    let xdg_dirs = xdg::BaseDirectories::with_prefix("rcj-matrix-bot")
        .expect("Failed to open XDG directories");
    let data_dir = xdg_dirs
        .create_data_directory("matrix-rust-sdk")
        .expect("Couldn't create data directory");

    // login to matrix
    let client_config = ClientConfig::new().store_path(data_dir);
    let homeserver_url = Url::parse(&config.homeserver).expect("Invalid homeserver");
    let client =
        Client::new_with_config(homeserver_url, client_config).expect("Failed to create client");

    match config.user {
        UserAuth::Session(session) => {
            client
                .restore_login(session)
                .await
                .expect("Failed to login");
        }
        UserAuth::Login(login) => {
            let response = client
                .login(&login.user_id, &login.password, None, Some("RcjBot"))
                .await
                .expect("failed to login");
            config.user = UserAuth::Session(Session {
                user_id: response.user_id,
                device_id: response.device_id,
                access_token: response.access_token,
            });
            let config =
                serde_json::to_string_pretty(&config).expect("Failed to reserialize config");
            fs::write(&opt.config, config).expect("Failed to write file");
        }
    }

    let warp_data = RcjMatrixBot::new(client.clone());
    let index_route = warp::any().and(with_data(warp_data)).and_then(index);
    let http = warp::serve(index_route).run(opt.listen_address);

    tokio::join!(listen_matrix(client), http);
}
