use std::path::PathBuf;
use structopt::StructOpt;
use serde::{Deserialize, Serialize};
use matrix_sdk::{events::{room::member::MemberEventContent, stripped::StrippedStateEvent},
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
    #[structopt(short = "l", long = "listen-port", default_value = "2001")]
    listen_port: u16,
}

#[derive(Deserialize, Serialize, Debug)]
struct UserSession {
    access_token: String,
    user_id: UserId,
    device_id: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct UserLogin {
    user_id: UserId,
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
            device_id: session.device_id,
        }
    }
}

#[derive(Deserialize, Debug)]
struct Config {
    user: UserAuth,
    homeserver: String,
}

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
        _room_member: &StrippedStateEvent<MemberEventContent>,
        _: Option<MemberEventContent>
    ) {
        /* TODO: update matrix-sdk
        if room_member.state_key != self.client.user_id {
            return;
        }
        */
        if let SyncRoom::Invited(room) = room {
            let room = room.read().await;
            println!("Autojoining room {}", room.display_name());
            // TODO: logging
            if let Err(err) = self.client
                .join_room_by_id(&room.room_id)
                .await
            {
                eprintln!("Failed to join room: {}", err.to_string());
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

    client.sync_forever(SyncSettings::default(), |_| async {}).await;
}

#[tokio::main]
async fn main() {
    let opt = Opt::from_args();
    println!("{:?}", opt);
    let config = fs::read_to_string(opt.config).expect("Failed to open config file");
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
            let response = client.login(login.user_id.to_string(), login.password, None, Some("RcjBot".to_owned())).await
                .expect("failed to login");
            config.user = UserAuth::UserSession(UserSession {
                user_id: response.user_id,
                device_id: response.device_id,
                access_token: response.access_token,
            });
            
        }
    }

    listen_matrix(client).await;
}