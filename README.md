# sql-engine

A technology proof-of-concept of using MySQL and SQL to query a levelup/leveldb database.

Implemented as part of a hack project for [campjs 2013](http://campjs.com).

Pull requests encouraged!

This will eventually become a plugin for the [level-queryengine](https://github.com/eugeneware/level-queryengine) pluggable query engine system.

## Quick start

To play around with this, `git clone` and `npm install` and start the example server and specify a port to listen to:

```
$ node server.js 3307
```

The example Server adds the following non-relational JSON documents to the local leveldb:

``` json
[
  { "name": "Bob", "num": 42, "awesome": "goodbye", "x": 99 },

  { "name": "Jane", "num": 43, "awesome": "blah",
    "car": { "make": "Toyota", "model": "Camry" } },

  { "name": "Peter", "num": 88, "awesome": "true",
    "car": { "make": "Toyota", "model": "Corolla" } }
]
```

Connect to the levelup MySQL server (authentication and database selection not currently implemented)

```
$ mysql -P 3308 --protocol=tcp
```

Execute some queries against the test 'users' table:

```
mysql> select * from users;
+-------+------+---------+------+----------+-----------+
| name  | num  | awesome | x    | car.make | car.model |
+-------+------+---------+------+----------+-----------+
| Bob   |   42 | goodbye |   99 | NULL     | NULL      |
| Jane  |   43 | blah    | NULL | Toyota   | Camry     |
| Peter |   88 | true    | NULL | Toyota   | Corolla   |
+-------+------+---------+------+----------+-----------+
3 rows in set (0.00 sec)

mysql> select name, num from users where car.make = 'Toyota';
+-------+------+
| name  | num  |
+-------+------+
|  Jane |   43 |
| Peter |   88 |
+-------+------+
2 rows in set (0.00 sec)
```

## How it works

* sql-engine uses the awesome [mysql2](https://github.com/sidorares/node-mysql2) library to do the MySQL proxying to look like a MySQL server protocol speaking server.
* sql-engine parses the SQL using [simpleSqlParser](https://github.com/dsferruzza/simpleSqlParser) into an AST.
* the SQL AST is then parsed into the mongodb query language and ran using [jsonquery-engine](https://github.com/eugeneware/jsonquery-engine) against the levelup/leveldb instance.

## Notes

This is highly experimental, and needs a lot more work to support the full suite of SQL operations.

* Currently only AND and OR are implemented for SQL queries.
* Currently only equality is implemented for SQL where clauses (eg. `colA = colB`)
* the 'FROM' statemenet will query a levelup "sublevel" by that name.
* No database authentication is implemented.
* No joins are currently implemented. I plan to use [foreign-key](https://github.com/substack/foreign-key) and/or [level-join](https://github.com/substack/level-join) to implement this.
* No sorting is implemented. I plan to use [sort-stream](https://github.com/dominictarr/sort-stream) to do that.
* simpleSqlParser also parses INSERT, DELETE and UPDATE statements, but these haven't been implemented.
