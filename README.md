# _campsi_/**api**
[![Build Status](https://travis-ci.org/campsi/api.svg?branch=master)](https://travis-ci.org/campsi/api)

Manage and expose **document-oriented** content through a configurable RESTful **API**. 

- Create schemas with [_campsi_/**architect**](https://github.com/campsi/architect).
- Talk to the API with [_campsi_/**admin**](https://github.com/campsi/admin).

## Features

#### API
- [x] Store and manage both **collections** or **individual** documents
- [x] Describe **complex data structures**, using _campsi_ components
- [x] State-based document **lifecycle** for approval workflows
- [x] `POST`, `PUT` and `DELETE` asynchronous **webhooks** for distributed architecture
- [x] Truly Stateless
- [ ] Patch updates
- [ ] Conflicts resolver

#### Querying
- [x] Embed related documents `?embed=shippingAddresses`
- [x] Complex **filtering** `?data.name=Thomas&data.address.city=London`
- [x] Complex **sorting** `?sort=name,-birthday`
- [x] Pagination `?page=4&perPage=20`
- [ ] Stored searches

#### Authentification & authorization
- [x] Role-Based Access-Control
- [x] Generate invitation tokens by role
- [x] PassportJS integration
- [x] Custom authentification providers
    - [x] [Local Database](lib/modules/auth/local.js)
    - [x] [Facebook](lib/modules/auth/facebook.js)
    - [x] [Twitter](lib/modules/auth/twitter.js)
    - [x] [Github](lib/modules/auth/github.js)
    - [x] [Google](lib/modules/auth/google.js)
- [ ] Rate limiter

#### Other
- [ ] Swagger / API doc generation
- [ ] Generate random mock data

#### Assets Management
- [X] Stream based upload system
- [X] Filtered and paginated GET route
- [X] Custom storage adapters
  - [X] [Local storage with rotating subfolders](lib/modules/assets/localAssetStorage.js)
  - [X] [Amazon S3](lib/modules/assets/s3AssetStorage.js)
  - [ ] Azure Blob Storage
  - [ ] Google Cloud Platform
- [ ] GraphicsMagick Metadata recognition
- [ ] Resize and convert media derivatives
    

## Concepts

### States & role permissions

States represent the different stages in a document lifecycle, like `published`, `draft` and `archived`. To each state is associated specific role-based permissions, defining allowed HTTP methods : 

| Method   | Possible actions on the state                                                |
|:---------|:---------------------------------------------------------------------------- |
| `GET`    | view and query the documents                                                 |
| `POST`   | create a new document                                                        |
| `PUT`    | edit an existing document or put a document in this state                    |
| `DELETE` | delete the state for the document                                            |

**A document can be in different states at the same time**, for example: 

1. the `published` version, visible on the website and the mobile app by everyone
2. the `waiting_for_approval` version that has to be validated by an admin
3. the new `draft` version an editor is already working on.

**A document can migrate from a state to another**, for example:

- You create a resource `ticket` for your customers error reporting. 
- `customer` role is allowed to `POST /docs/tickets` in the default state `submitted`
- `support` role is allowed to `PUT /docs/tickets` in the states `replied` or `read`

**You can create any number of states**: 

- `published`
- `draft`
- `waiting_for_approval`
- `approved`
- `rejected` 
- `populationA`
- `populationB`
- `submitted`
- `read`
- `replied`
- …

**You can create any number of roles**: 

- `admin` 
- `editor` 
- `manager` 
- `customer` 
- `user`
- `public` 
- `visitor` 
- …


### Resource

The resource is the document template, it describes the fields and validation rules.

### Document

A document is an instance of a resource. It has an `id` and a value for each defined state, which is encapsulated in a property named `data`.

#### Anatomy of a document
```javascript
let doc = {
	id: ObjectID("58205e4fa5dc6c3b381a0e9b"),
    states: {
    	published: {
        	createdAt: "2016-11-07 10:58:23.950Z",
            createdBy: "58277c406d6157a751399052",
            data: {
            	title: "Hello World",
                content: "I'm the published version"
            }
        },
    	draft: {
        	createdAt: "2016-11-07 11:22:12.950Z",
            createdBy: "58277c406d6157a751399052",
            data: {
            	title: "Hello World",
                content: "I'm the draft version"
            }
        },
    }    
}
```

### Relationships & document embedding

Relationships between resources are resolved:

- **automatically**, if the relationship has the property `embed` set to `true`
- **on demand**, if a `embed={rel}` parameter is passed in the query string

Because there are no `JOIN` in MongoDB, embedding documents requires the execution of supplementary queries. For performance reason, the results are memoized during the request lifetime. 

### Webhook

You can configure webhooks that are triggered when an request processed by _campsi_/**api** match a specific scope (action, state, resource). Once triggered, the webhook send an asynchronous HTTP request to the endpoint `uri` specified in its configuration.

_todo_ distributed architecture example

## Usage

```sh
node index.js 
# or
npm start
```

### Flags
```sh
--schema     "path/to/the/schema.json"  # specifies the json schema to use 
--port       3000                       # set the HTTP port to listen to
--data       "/mnt/nfs/data"            # repository for upload
```


## _campsi_/**schema** specification

#### Root

| Property      | Type                 |  Description 
|:------------- |:-------------------  |:--------------------------------------
| `name`        | `String`             | unique identifier of your api
| `title`       | `String`             | title of the API
| `description` | `String`             | markdown description
| `roles`       | `<Role>`             | roles hashmap
| `types`       | `<ResourceType>`     | resource types hashmap
| `resources`   | `<Resource>`         | resources hasmap

#### Role

| Property    | Type      | Description 
|:----------- |:--------  |:------------------------------
| `label`     | `String`  | unique identifier of your api
| `auth`      | `Boolean` | title of the API
| `admin`     | `Boolean` | markdown descripition

#### ResourceType

| Property          | Type                      |  Description 
|:----------------- |:------------------------  |:--------------------------------------
| `defaultState`    | `String`                  | name of the state any request will default to
| `states`          | `<State>`                 | hashmap of the states
| `permissions`     | `<Role, <State, Method>>` | Allowed HTTP methods by role and by state

#### State

| Property       | type         |  Description 
|:-------------- |:-----------  |:--------------------------------------
| `name`         | `String`     | name of the state any request will default to
| `label`        | `String`     | hashmap of the states
| `validate`     | `Boolean`    | wether the data has to be valid to be saved or not

#### Resource

| Property          | type         |  Description 
|:----------------- |:-----------  |:--------------------------------------
| `title`           | `String`     | readable title
| `description`     | `String`     | markdown description
| `type`            | `String`     | name of the ResourceType
| `fields`          | `[Object]`   | list of the fields composing the model
| `hooks`           | `[Hook]`     | list of hooks bound to the resource
| `rels`            | `<Rel>`      | hashmap of relationships

#### Rel

| Property          | type         |  Description 
|:----------------- |:-----------  |:--------------------------------------
| `path`            | `String`     | property path
| `resource`        | `String`     | name of the resource it points to (self reference is OK)
| `embed`           | `Boolean`    | resolve relation automatically
| `fields`          | `[String]`   | list of the fields that gets embedded


#### Hook

| Property          | type              |  Description 
|:----------------- |:----------------  |:--------------------------------------
| `name`            | `String`          | hook identifier
| `uri`             | `String`          | todo support parameter
| `method`          | `String`          | one of `POST` `GET` `PUT` `DELETE`
| `payload`         | `Boolean`         | if true and method is `POST` or `PUT`, send the `data`
| `on`              | `[String]`        | list of actions 
| `states`          | `[String]`        | list of states 
| `retry`           | `Number`          | number of time the HTTP client tries to reach the endpoint
| `timeout`         | `Number`          | number of seconds before the HTTP client hangs up
| `headers`         | `<String,String>` | hashmap of the request headers


## Requirements

- NodeJS v6.0.0
- MongoDB v2.6.0
- Optional
  - ImageMagick
  - Graphics Magick