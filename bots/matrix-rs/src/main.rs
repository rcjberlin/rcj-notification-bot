#![feature(proc_macro_hygiene, decl_macro)]
use std::path::PathBuf;
use structopt::StructOpt;
use serde::{Deserialize, Serialize};
use matrix_sdk::{events::{room::member::MemberEventContent, StrippedStateEvent, room::message::{MessageEventContent, TextMessageEventContent},
                                                                                                AnyMessageEventContent, SyncMessageEvent},

                 Client, ClientConfig, EventEmitter, SyncRoom, SyncSettings, Session, };
use matrix_sdk::identifiers::UserId;

use std::fs;
use std::convert::From;
use url::Url;
use async_trait::async_trait;

#[derive(Debug, StructOpt)]
#[structopt(name = "rcj-notification-bot", about = "Matrix bot to notify teams during the competition.")]
struct Opt {
    /// Activate debug mode
    // short and long flags (-d, --debug) will be deduced from the field's name
    #[structopt(short, long)]
    debug: bool,

    /// Config file
    #[structopt(short, long, parse(from_os_str), default_value = "matrix-bot.json")]
    config: PathBuf,

    /// Port to listen on for BotManager callbacks
    // we don't want to name it "speed", need to look smart
    #[structopt(short = "l", long = "listen-address", default_value = "127.0.0.1:2001")]
    listen_address: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct UserSession {
    access_token: String,
    user_id: UserId,
    device_id: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct UserLogin {
    user_id: String,
    password: String,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(untagged)]
enum UserAuth {
    UserSession(UserSession),
    UserLogin(UserLogin),
}

impl From<UserSession> for Session {
    fn from(session: UserSession) -> Self {
        Self {
            access_token: session.access_token,
            user_id: session.user_id,
            device_id: session.device_id.into(),
        }
    }
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

#[async_trait]
impl EventEmitter for RcjMatrixBot {
    // autojoining
    async fn on_stripped_state_member(
        &self,
        room: SyncRoom,
        room_member: &StrippedStateEvent<MemberEventContent>,
        _: Option<MemberEventContent>
    ) {
        // unwrap is ok, since we initialized the client
        if room_member.state_key != self.client.user_id().await.unwrap() {
            return;
        }
        if let SyncRoom::Invited(room) = room {
            let room = room.read().await;
            println!("Autojoining room {}", room.display_name());
            if let Err(err) = self.client
                .join_room_by_id(&room.room_id)
                .await
            {
                eprintln!("Failed to join room: {:?}", err);
            }
        }
    }

    async fn on_room_message(&self, room: SyncRoom, event: &SyncMessageEvent<MessageEventContent>) {
        if let SyncRoom::Joined(room) = room {
            let msg_body = if let SyncMessageEvent {
                content: MessageEventContent::Text(TextMessageEventContent { body: msg_body, ..}),
                ..
            } = event
            {
                msg_body.clone()
            } else {
                String::new()
            };

            if msg_body.starts_with("!echo ") {
                let content = AnyMessageEventContent::RoomMessage(MessageEventContent::Text(
                    TextMessageEventContent {
                        body: msg_body[6..].to_string(),
                        formatted: None,
                        relates_to: None,
                    },
                ));

                // we clone here to hold the lock as little time as possible.
                let room_id = room.read().await.room_id.clone();

                println!("sending");

                if let Err(err) = self.client
                    .room_send(&room_id, content, None)
                    .await
                {
                    eprintln!("Failed to send message: {:?}", err);
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

    client.sync(SyncSettings::default()).await;
}

use actix_web::{web, App, HttpServer};
use ruma::RoomId;
use std::convert::TryFrom;

async fn index(data: web::Data<RcjMatrixBot>) -> String {
    let user_id = data
        .client
        .user_id()
        .await;
    let user_id = user_id
        .as_ref()
        .map(|id| id.as_str())
        .unwrap_or("undefined");

    let message = "Hallo Welt! :D";

    let content = AnyMessageEventContent::RoomMessage(MessageEventContent::Text(
        TextMessageEventContent {
            body: message.to_owned(),
            formatted: None,
            relates_to: None,
        },
    ));


    // we clone here to hold the lock as little time as possible.
    let room_id = RoomId::try_from("!FbwAWnZrdbeccOIHEo:tchncs.de").unwrap();

    if let Err(err) = data.client
        .room_send(&room_id, content, None)
        .await
    {
        format!("Failed to send message: {:?}", err)
    }
    else {
        format!("{}: {}", user_id, message)
    }
}

use std::thread;

#[tokio::main]
async fn main() {
    let opt = Opt::from_args();
    println!("{:?}", opt);
    let config = fs::read_to_string(&opt.config).expect("Failed to open config file");
    let mut config: Config = serde_json::from_str(&config).expect("Failed to parse config file");
    println!("{:?}", config);

    // create data directory
    let xdg_dirs = xdg::BaseDirectories::with_prefix("rcj-matrix-bot").expect("Failed to open XDG directories");
    let data_dir = xdg_dirs.create_data_directory("matrix-rust-sdk").expect("Couldn't create data directory");

    // login to matrix
    let client_config = ClientConfig::new().store_path(data_dir);
    let homeserver_url = Url::parse(&config.homeserver).expect("Invalid homeserver");
    let client = Client::new_with_config(homeserver_url, client_config).expect("Failed to create client");

    match config.user {
        UserAuth::UserSession(session) => {
            client.restore_login(session.into()).await.expect("Failed to login");
        },
        UserAuth::UserLogin(login) => {
            let response = client.login(&login.user_id, &login.password, None, Some("RcjBot")).await
                .expect("failed to login");
            config.user = UserAuth::UserSession(UserSession {
                user_id: response.user_id,
                device_id: response.device_id.to_string(),
                access_token: response.access_token.to_string(),
            });
            let config = serde_json::to_string_pretty(&config).expect("Failed to reserialize config");
            fs::write(&opt.config, config).expect("Failed to write file");
        }
    }

    let web_data = RcjMatrixBot::new(client.clone());

    let handle = thread::spawn(move || {
        actix_rt::System::new("rcj-notification-bot-matrix")
            .block_on(async move {
                let client = web::Data::new(web_data);
                HttpServer::new(move || {
                    App::new()
                        .app_data(client.clone())
                        .route("/", web::get().to(index))
                })
                .disable_signals() // fix endlessly running even after ctrl+c
                .bind("127.0.0.1:8000").expect("failed to bind port")
                .run()
                .await
                .expect("Server stopped unexpectedly")
            })
    });

    listen_matrix(client).await;
    handle.join().unwrap();
}