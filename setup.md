# Installation

```bash
npm install
```

# Setup

Set environmental variables in `.env` file:

```bash
# .env
TELEGRAM_BOT_TOKEN = 1234567890:abcdefghij-123-klmnopqrstuvwxyz
TELEGRAM_ADMIN_USERNAMES = ["nikolockenvitz"]
```

# Run

```bash
ts-node index.ts
# or
npm run start
```

# Matrix

Setup instructions for used components:

* Matrix homeserver: [Synapse on debian](https://github.com/matrix-org/synapse/blob/master/INSTALL.md#matrixorg-packages)
* Signal bridge [matrix-puppet-signal](https://github.com/witchent/matrix-puppet-signal),
  in future [mautrix-signal](https://github.com/tulir/mautrix-signal) might be a better option
* Whatsapp bridge [mautrix-whatsapp](https://github.com/tulir/mautrix-whatsapp/wiki)
* Maubot manager [maubot](https://github.com/maubot/maubot/wiki/Setup)

Using an unpriviledged user to run bridges/bots.

