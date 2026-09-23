# Backend fix required for chat: parallel arrays MongoDB error

If sending a message returns:

`cannot index parallel arrays [deletedBy] [participants]`

this is a MongoDB schema/index error in the backend, not a React/Vite error. MongoDB cannot create a compound index when both indexed fields are arrays.

## What to change

Find the Chat/Conversation Mongoose schema and remove any compound index similar to:

```js
chatSchema.index({ participants: 1, deletedBy: 1 });
```

or the same fields in the opposite order.

Use separate indexes instead if both fields need indexing:

```js
chatSchema.index({ participants: 1 });
chatSchema.index({ deletedBy: 1 });
```

If an old invalid index already exists in MongoDB, drop that old compound index from the collection before restarting the backend. The exact index name can be checked with `db.chats.getIndexes()` (or the equivalent collection name).

Do not add a compound index containing two array fields again.
