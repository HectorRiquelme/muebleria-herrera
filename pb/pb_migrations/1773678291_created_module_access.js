/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ma0000000000001",
    "created": "2026-03-16 16:24:51.614Z",
    "updated": "2026-03-16 16:24:51.614Z",
    "name": "module_access",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "pnm3kkda",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "sivsgq8d",
        "name": "module",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "vfhexbeg",
        "name": "enabled",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || user = @request.auth.id)",
    "createRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "updateRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("ma0000000000001");

  return dao.deleteCollection(collection);
})
