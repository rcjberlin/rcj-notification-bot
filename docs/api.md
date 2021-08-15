# General Response Format

All routes must return a JSON including the property `successful` and optionally also the properties `message` and/or `data`.

```json
{
    "successful": "boolean",
    "message?": "string",
    "data?": "any"
}
```

# Bot Manager

The Bot Manager handles the communication with all bots and forwards messages from other services to them.
It listens at one internal port (for communication with bots) and on one external port (for communication with services).

## Authentication

All requests sent to the external port must include the Authorization header `Bearer <token>` where `<token>` is some string allow-listed in the config of the Bot Manager.

## GET /

Check whether Bot Manager is running.

Response (200):

```json
{
    "successful": true
}
```

## GET /v1/channels

Get a list of all the available channels.

Response (200):

```json
{
    "successful": true,
    "data": [
        {
            "id": 1,
            "channel": "General"
        },
        "..."
    ]
}
```

## POST /v1/send

Send a message to certain channels (for all bots).

Request Body:

```json
{
    "message": "Hello, World!",
    "channelIds": [ 1 ]
}
```

Response (200):

```jsonc
{
    "successful": true,
    "data": {
        "users": 0, // number of users the message has been sent to
    },
}
```

# Bot

A Bot handles the direct communication with the users and sends messages as directed by the Bot Manager.

## GET /

Check whether Bot is running.

Response (200):

```json
{
    "successful": true
}
```

## POST /v1/send

Send a message to certain channels.

Request Body:

```json
{
    "message": "Hello, World!",
    "channelIds": [ 1 ]
}
```

Response (200):

```jsonc
{
    "successful": true,
    "data": {
        "users": 0, // number of users the message has been sent to
    },
}
```

# Notification Manager

The Notification Manager receives events from the rcj-server.
Similar to the Bot Manager, it listens on an authenticated external port for that.

## GET /

Check whether Notification Manager is running.

Response (200):

```json
{
    "successful": true
}
```

## POST /v1/event

Send a an event to the Notification Manager, e.g. a run started/finished.

Request Body:

```json
{
    "event": "run-started",
    "teamId": "RL 1",
}
```

Response (200):

```jsonc
{
    "successful": true,
}
```
