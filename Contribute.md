# Contributing to reactflow

## how to launch the app

### launch the main API

you should add a .env file. you can take exemple on the [.env.exemple](./.env.example)

```bash
docker compose -f docker-compose-dev.yaml up
```

### launch spotify microservice

you should add a .env file. you can take exemple on the [.env.exemple](./micro_services/spotify/.env.example)

then
```bash
cd micro_services/spotify
docker compose up
```

### launch google sheets microservice

you should add a .env file. you can take exemple on the [.env.exemple](./micro_services/google_sheets/.env.example)

then
```bash
cd micro_services/micro_service
docker compose up
```

### launch youtube microservice

you should add a .env file. you can take exemple on the [.env.exemple](./micro_services/youtube/.env.example)

then
```bash
cd micro_services/youtube
docker compose up
```

### launch twitch microservice

you should add a .env file. you can take exemple on the [.env.exemple](./micro_services/twitch/.env.example)

then, in a first terminal do
```bash
ngrok http 3004
```
get the url given in the cli interface, something like `https://fitful-deon-delayingly.ngrok-free.dev`
and add it in your [.env](./micro_services/twitch/.env).

in a second terminal do
```bash
cd micro_services/twitch
docker compose up
```

### launch discord microservice

you should add a .env file. you can take exemple on the [.env.exemple](./micro_services/discord/.env.example)

then
```bash
cd micro_services/discord
docker compose up
```

### launch gmail microservice

you should add a .env file. you can take exemple on the [.env.exemple](./micro_services/gmail/.env.example)

then
```bash
cd micro_services/gmail
docker compose up
```

## how to create a new micro service

a microservice is fully independant of the main api. you have to create a new api_key in the main api by calling `POST ${mainApiUrl}/admin/api-keys` with an admin jwt. then just add your api keys to all calls to the man api as a baerier token: `Bearer ${API_KEY}`,

### registering to the main API
you can register your service by calling `POST ${mainApiUrl}/auth/services/login`
with giving a few parrameters:
- apiKey
- serviceName
- microServiceUrl
- iconUrl

the API will then try to call your `GET ${microServiceUrl}/area` to sync everything

### sync the main API

you must create a  `GET ${microServiceUrl}/area` route in your microsrvice. this route will give infos about all your micro service's nodes.
it have to send this informations:
- areaId
- areaName
- areaDescription
- serviceType
- parameters
- outputs

the parameters and outputs field should contains this informations:
- name
- type (string, bool, int)
- description
- required (bool)

### connect to service

the main api will redirect users to connect to your new implemented microservice using a `POST ${MICROSERVICE_URL}/auth/innitiate`
you MUST implement this route in order to implement oauth connection to the service, the API will give a `userID` to this route.

then in the callback route (the precise route should be defined in your .env) you should of course redirect to the front end

### trigger a node

the API, to trigger your node will call a `POST ${MICROSERVICE_URL}/execute`
the api will give you some information to the node to trigger:
- type ('action' or 'reaction')
- name
- userId
- config (json)
- input (json)

and you must repond to this call with this informations:
- success (bool)
- result (optinal json)
- error (optinal json)

### trigger a workflow

to trigger a workflow because of an action, you should call the `POST ${mainApiUrl}/workflow/trigger/${userId}/${actionName}`
and this informations:
- userId
- data: (json containing the output)
