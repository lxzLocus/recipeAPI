/* import module */
const path = require('path');
const Database = require('better-sqlite3');
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

/* config */
app.use(bodyParser.json());
const dbPath = path.join(__dirname, './db/database.db');
const db = new Database(dbPath, { verbose: null });



/*Launch Server*/
var server = app.listen(3000, function () {
    initialize_tables();
    console.log("Node.js is listening to PORT:" + server.address().port);
});




/*API LISTS*/

//レシピを作成
app.post("/recipes", function (req, res) {
    const { title, making_time, serves, ingredients, cost } = req.body;

    //情報が抜けている場合
    if (!title || !making_time || !serves || !ingredients || !cost) {
        return res.status(400).json({
            message: "Recipe creation failed!",
            required: "title, making_time, serves, ingredients, cost"
        });
    }

    const stmt = db.prepare(`
        INSERT INTO recipes (title, making_time, serves, ingredients, cost)
        VALUES (?, ?, ?, ?, ?);
    `);

    try {
        stmt.run(title, making_time, serves, ingredients, cost);
        const newID = db.prepare("SELECT last_insert_rowid() AS id;").get().id;
        const currentTime = db.prepare("SELECT created_at, updated_at FROM recipes WHERE id = ?;").get(newID);

        res.status(200).json({
            message: "Recipe successfully created!",
            recipe: [ {
                "id": newID, 
                "title": title, 
                "making_time": making_time, 
                "seves": serves, 
                "ingredients": ingredients, 
                "cost": cost, 
                "created_at": currentTime, 
                "updated_at": currentTime
            }]
        });

    } catch (error) {
        res.status(400).json({
            "message": "Recipe creation failed!",
            "required": "title, making_time, serves, ingredients, cost"
        });
    }
});

//全レシピ一覧を返す
app.get("/recipes", function (req, res) {

    const stmt = db.prepare(`
        SELECT id, title, making_time, serves, ingredients, cost, created_at, updated_at
        FROM recipes
    `);

    try {
        const recipes = stmt.all();

        res.status(200).json({
            recipes: recipes
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to fetch recipes!"
        });
    }
});

//指定レシピを一つ返す
app.get("/recipes/:id", function (req, res) {
    let id = req.params.id;

    const stmt = db.prepare(`
        SELECT id, title, making_time, serves, ingredients, cost, created_at, updated_at
        FROM recipes
        WHERE id = ?
    `);

    try {
        const recipe = stmt.get(id);

        if (recipe) {
            res.status(200).json({
                message: "Recipe details by id",
                recipe: recipe
            });
        } else {
            res.status(404).json({
                message: "No Recipe found"
            });
        }
    } catch (error) {
        res.status(400).json({
            message: "Failed to fetch recipe"
        });
    }
});

//指定レシピを更新
app.patch("/recipes/:id", function (req, res) {
    let id = req.params.id;
    const { title, making_time, serves, ingredients, cost } = req.body;

    //情報が抜けている場合
    if (!title || !making_time || !serves || !ingredients || !cost) {
        return res.status(400).json({
            message: "Recipe update failed!",
            required: "title, making_time, serves, ingredients, cost"
        });
    }

    const stmt = db.prepare(`
        UPDATE recipes
        SET title = ?, making_time = ?, serves = ?, ingredients = ?, cost = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
    `);

    try {
        stmt.run(title, making_time, serves, ingredients, cost, id);
        const updatedRecipe = db.prepare("SELECT * FROM recipes WHERE id = ?;").get(id);

        res.status(200).json({
            message: "Recipe successfully updated!",
            recipe: [updatedRecipe]
        });

    } catch (error) {
        res.status(400).json({
            "message": "Recipe creation failed!",
            "required": "title, making_time, serves, ingredients, cost"
        });
    }
});

//指定レシピを削除
app.delete("/recipes/:id", function (req, res) {
    let id = req.params.id;

    const stmt = db.prepare(`
        DELETE FROM recipes
        WHERE id = ?
    `);

    const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?;").get(id);

    if (!recipe) {
        return res.status(404).json({
            message: "No Recipe found"
        });
    }

    stmt.run(id);

    res.status(200).json({
        message: "Recipe successfully removed!"
    });
});



/*Database*/
//テーブルの初期化
function initialize_tables() {
    // テーブル削除
    db.prepare("DROP TABLE IF EXISTS recipes;").run();

    // テーブル作成
    const CREATE_RECIPES_TABLE = `
        CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(100) NOT NULL,
        making_time VARCHAR(100) NOT NULL,
        serves VARCHAR(100) NOT NULL,
        ingredients VARCHAR(300) NOT NULL,
        cost INTEGER NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `;
    db.prepare(CREATE_RECIPES_TABLE).run();

    // 初期データ投入
    const insertDataQuery = `
        INSERT INTO recipes (title, making_time, serves, ingredients, cost) VALUES
        ('チキンカレー', '45分', '4人', '玉ねぎ,肉,スパイス', 1000),
        ('オムライス', '30分', '2人', '玉ねぎ,卵,スパイス,醤油', 700);
    `;
    db.prepare(insertDataQuery).run();
}
