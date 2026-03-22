/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "g00000000000001",
    "created": "2026-03-16 13:51:31.127Z",
    "updated": "2026-03-16 13:51:31.127Z",
    "name": "landing_images",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "3uyqqck2",
        "name": "title",
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
        "id": "8f2preef",
        "name": "image",
        "type": "file",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/webp"
          ],
          "thumbs": null,
          "maxSelect": 1,
          "maxSize": 10485760,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "hik2zlfc",
        "name": "order",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "28w2sefw",
        "name": "active",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "updateRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.role = \"admin\"",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("g00000000000001");

  return dao.deleteCollection(collection);
})
