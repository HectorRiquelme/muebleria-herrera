/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "t00000000000001",
    "created": "2026-03-16 13:50:32.483Z",
    "updated": "2026-03-16 13:50:32.483Z",
    "name": "tmp_file_test",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "wpokyegu",
        "name": "doc",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "application/pdf",
            "image/jpeg",
            "image/png"
          ],
          "thumbs": null,
          "maxSelect": 1,
          "maxSize": 10485760,
          "protected": false
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("t00000000000001");

  return dao.deleteCollection(collection);
})
