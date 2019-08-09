const ids = books.map(book => book.id);
const groups = await msContentScript.aggregate([
    { $match: { source_id: sourceId, res_id: { $in: ids } } },
    { $group: { _id: '$res_id', count: { $sum: 1 } } },
]);
const kv = {};
groups.forEach(group => {
    kv[group._id] = group.count;
});