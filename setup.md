# Installation

Make sure to have Node.js and npm installed.

Navigate into each folder and run the following commands.
Go back to the root directory after each step.

```bash
# bot-manager
$ cd bot-manager
$ npm install

# telegram bot
$ cd bots/telegram
$ npm install

# matrix bot
# todo
```

# Setup

Configure all services in `config.json`.

```json
{
    "botmanager": {
        "INTERNAL_PORT": 41401,
        "EXTERNAL_PORT": 1337,
        "TOKENS": [
            "token-to-authenticate-requests-from-rcj-server",
            "token-to-authenticate-requests-from-admin-dashboard"
        ]
    },
    "bots": {
        "telegram": {
            "INTERNAL_PORT": 41402,
            "TELEGRAM_BOT_TOKEN": "1234567890:abcdefghij-123-klmnopqrstuvwxyz",
            "TELEGRAM_ADMIN_USERNAMES": [
                "nikolockenvitz"
            ],
            "TELEGRAM_CHAT_IDS_NOTIFY_ON_ERROR": [
                123456789
            ]
        },
        "matrix": {
            "INTERNAL_PORT": 41403
        }
    }
}
```

# Run

```bash
# bot-manager
$ cd bot-manager
$ node index.js # npm run start

# telegram bot
$ cd bots/telegram
$ ts-node index.ts # npm run start

# matrix bot
# todo
```

# Matrix

Setup instructions for used components:

* Matrix homeserver: [Synapse on debian](https://github.com/matrix-org/synapse/blob/master/INSTALL.md#matrixorg-packages)
* Signal bridge [matrix-puppet-signal](https://github.com/witchent/matrix-puppet-signal),
  in future [mautrix-signal](https://github.com/tulir/mautrix-signal) might be a better option
* Whatsapp bridge [mautrix-whatsapp](https://github.com/tulir/mautrix-whatsapp/wiki)
* Maubot manager [maubot](https://github.com/maubot/maubot/wiki/Setup)

Using an unpriviledged user to run bridges/bots.

