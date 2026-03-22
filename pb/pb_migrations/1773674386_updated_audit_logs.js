/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("a00000000000001")

  collection.deleteRule = "@request.auth.id != \"\" && @request.auth.role = \"admin\""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("a00000000000001")

  collection.deleteRule = null

  return dao.saveCollection(collection)
})
