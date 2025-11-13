# api

[<- back to main readme](../README.md)


### contributors

| name | role | pp
|:-----------:|:-----------:|------|
|  lorenzo La Rocca | responsible | ![Profile Picture](https://avatars.githubusercontent.com/u/86523064?v=44&size=200)|
|  Nathan Deleger | contributor | ![Profile Picture](https://avatars.githubusercontent.com/u/146707451?v=4&size=200)|
|  Ulysse Mercadal | contributor | ![Profile Picture](https://avatars.githubusercontent.com/u/146720787?v=4&size=200)|

## node systeme
to understand our node system in depth please visit the node doumentation:

[documentation here](WorkflowDoc.md)

## avaibles routes

> to get more infos on all routes lauch the main api with  `docker compose -f docker-compose-dev.yaml up` and visit `http://localhost:3000/api#/`

| METHOD  | ROUTE | PARAMETERS |
|---------|-------|-------------------|
| GET     | /user/:id | `id`
| PATCH   | /user/:id | `id`
| DELETE  | /user/:id | `id`
| POST    | /workflow/trigger/:userId/:actionName | `userId`, `actionName`
| POST    | /workflow/trigger/test/:serviceId/:actionName | `serviceId`, `actionName` | - | ``` ``` |
| GET     | /workflow/:id | `id` | - | ``` ``` |
| PATCH   | /workflow/:id | `id` | - | ``` ``` |
| DELETE  | /workflow/:id | `id` | - | ``` ``` |
| PATCH   | /workflow/:id/toggle | `id` | - | ``` ``` |
| POST    | /workflow/trigger/:triggerId | `triggerId` | - | ``` ``` |
| POST    | /workflow/:workflowId/node | `workflowId` | - | ``` ``` |
| GET     | /workflow/:workflowId/node | `workflowId` | - | ``` ``` |
| GET     | /workflow/:workflowId/node/:id | `workflowId`, `id` | - | ``` ``` |
| PATCH   | /workflow/:workflowId/node/:id | `workflowId`, `id` | - | ``` ``` |
| DELETE  | /workflow/:workflowId/node/:id | `workflowId`, `id` | - | ``` ``` |
| PATCH   | /workflow/:workflowId/node/:id/toggle | `workflowId`, `id` | - | ``` ``` |
| POST    | /workflow/:workflowId/node/:id/execute | `workflowId`, `id` | - | ``` ``` |
| POST    | /workflow/execute/:logicType | `logicType` | - | ``` ``` |
| POST    | /workflow/:workflowId/connection | `workflowId` | - | ``` ``` |
| GET     | /workflow/:workflowId/connection | `workflowId` | - | ``` ``` |
| GET     | /workflow/:workflowId/connection/:id | `workflowId`, `id` | - | ``` ``` |
| PATCH   | /workflow/:workflowId/connection/:id | `workflowId`, `id` | - | ``` ``` |
| DELETE  | /workflow/:workflowId/connection/:id | `workflowId`, `id` | - | ``` ``` |
| POST    | /credentials/connect/:serviceId | `serviceId` | - | ``` ``` |
| GET     | /credentials/user/:userId | `userId` | - | ``` ``` |
| GET     | /credentials/user/:userId/service/:serviceId | `userId`, `serviceId` | - | ``` ``` |
| GET     | /credentials/user/:userId/service-name/:serviceName | `userId`, `serviceName` | - | ``` ``` |
| GET     | /credentials/:id | `id` | - | ``` ``` |
| PATCH   | /credentials/:id | `id` | - | ``` ``` |
| DELETE  | /credentials/:id | `id` | - | ``` ``` |
| GET     | /credentials/check/:userId/:serviceId | `userId`, `serviceId` | - | ``` ``` |
| DELETE  | /credentials/user/:userId/service/:serviceId | `userId`, `serviceId` | - | ``` ``` |
| GET     | /admin/api-keys/:id | `id` | - | ``` ``` |
| PATCH   | /admin/api-keys/:id | `id` | - | ``` ``` |
| POST    | /admin/api-keys/:id/regenerate | `id` | - | ``` ``` |
| DELETE  | /admin/api-keys/:id | `id` | - | ``` ``` |
| GET     | /services/:id | `id` | - | ``` ``` |
| GET     | /services/by-name/:name | `name` | - | ``` ``` |
| PATCH   | /services/:id | `id` | - | ``` ``` |
| PATCH   | /services/:id/api-key | `id` | - | ``` ``` |
| POST    | /services/deactivate-by-key/:apiKeyId | `apiKeyId` | - | ``` ``` |
| DELETE  | /services/:id | `id` | - | ``` ``` |
