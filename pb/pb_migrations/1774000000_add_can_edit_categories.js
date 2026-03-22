/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("user_permissions")

  collection.fields.addAt(collection.fields.length, new Field({
    "id": "f_up_edit_categories",
    "name": "can_edit_categories",
    "type": "bool",
    "required": false
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("user_permissions")

  collection.fields.removeById("f_up_edit_categories")

  return app.save(collection)
})
