/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "a00000000000001",
    "created": "2026-03-16 13:52:11.402Z",
    "updated": "2026-03-16 13:52:11.402Z",
    "name": "audit_logs",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "6e1b7uvt",
        "name": "user",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "82pvpnhc",
        "name": "action",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "create",
            "update",
            "delete",
            "login",
            "logout",
            "inventory_check",
            "export"
          ]
        }
      },
      {
        "system": false,
        "id": "gm5metod",
        "name": "collection",
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
        "id": "z1lgl02l",
        "name": "record_id",
        "type": "text",
        "required": false,
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
        "id": "gdprg7qz",
        "name": "description",
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
        "id": "lovqfewm",
        "name": "old_data",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1048576
        }
      },
      {
        "system": false,
        "id": "ny1q0n4z",
        "name": "new_data",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1048576
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("a00000000000001");

  return dao.deleteCollection(collection);
})
