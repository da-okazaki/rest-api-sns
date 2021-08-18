// packages
import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import bodyParser from 'body-parser';

// express
const app: express.Express = express();

// constants
const DB_PATH = 'app/db/database.sqlite3';

// リクエストのbodyをパースする設定
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// publicディレクトリを静的ファイル群のルートディレクトリとして設定
app.use(express.static(path.join(__dirname, 'public')));

//============================================
// GET
//============================================
/**
 * Get all users
 */
app.get('/api/v1/users', (req: express.Request, res: express.Response) => {
  // Connect database
  const db = new sqlite3.Database(DB_PATH);
  db.all('SELECT * FROM users', (err: any, rows: any) => {
    res.json(rows);
  });

  db.close();
});

/**
 * Get a user
 */
app.get('/api/v1/users/:id', (req: express.Request, res: express.Response) => {
  // Connect database
  const db = new sqlite3.Database(DB_PATH);
  const id = req.params.id;

  db.get(`SELECT * FROM users WHERE id = ${id}`, (err: any, row: any) => {
    if (!row) {
      res.status(404).send({ error: 'Not Found!' });
    } else {
      res.status(200).json(row);
    }
  });

  db.close();
});

/**
 * Get following users
 */
app.get('/api/v1/users/:id/following', (req: express.Request, res: express.Response) => {
  // Connect database
  const db = new sqlite3.Database(DB_PATH);
  const id = req.params.id;

  db.all(
    `SELECT * FROM following LEFT JOIN users ON following.followed_id = users.id WHERE following_id = ${id};`,
    (err: any, rows: any) => {
      if (!rows) {
        res.status(404).send({ error: 'Not Found!' });
      } else {
        res.status(200).json(rows);
      }
    }
  );

  db.close();
});

/**
 * Search users matching keyword
 */
app.get('/api/v1/search', (req: express.Request, res: express.Response) => {
  // Connect database
  const db = new sqlite3.Database(DB_PATH);
  const keyword = req.query.q;

  db.all(`SELECT * FROM users WHERE name LIKE "%${keyword}%"`, (err: any, rows: any) => {
    res.json(rows);
  });

  db.close();
});

const run = async (sql: string, db: any) => {
  return new Promise<void>((resolve, reject) => {
    db.run(sql, (err: any) => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
};

//============================================
// POST
//============================================
/**
 * Create a new user
 */
app.post('/api/v1/users', async (req: express.Request, res: express.Response) => {
  if (!req.body.name || req.body.name === '') {
    res.status(400).send({ error: 'ユーザー名が指定されていません。' });
  } else {
    // Connect database
    const db = new sqlite3.Database(DB_PATH);

    const name = req.body.name;
    const profile = req.body.profile ? req.body.profile : '';
    const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : '';

    try {
      await run(
        `INSERT INTO users (name, profile, date_of_birth) VALUES ("${name}", "${profile}", "${dateOfBirth}")`,
        db
      );
      res.status(201).send({ message: '新規ユーザーを作成しました。' });
    } catch (e) {
      res.status(500).send({ error: e });
    }

    db.close();
  }
});

//============================================
// PUT
//============================================
/**
 * Update user data
 */
app.put('/api/v1/users/:id', async (req: express.Request, res: express.Response) => {
  if (!req.body.name || req.body.name === '') {
    res.status(400).send({ error: 'ユーザー名が指定されていません。' });
  } else {
    // Connect database
    const db = new sqlite3.Database(DB_PATH);
    const id = req.params.id;

    // 現在のユーザー情報を取得する
    db.get(`SELECT * FROM users WHERE id=${id}`, async (err: any, row: any) => {
      if (!row) {
        res.status(404).send({ error: '指定されたユーザーが見つかりません。' });
      } else {
        const name = req.body.name ? req.body.name : row.name;
        const profile = req.body.profile ? req.body.profile : row.profile;
        const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : row.date_of_birth;

        try {
          await run(
            `UPDATE users SET name="${name}", profile="${profile}", date_of_birth="${dateOfBirth}" WHERE id=${id}`,
            db
          );
          res.status(200).send({ message: 'ユーザー情報を更新しました。' });
        } catch (e) {
          res.status(500).send({ error: e });
        }
      }
    });

    db.close();
  }
});

//============================================
// DELETE
//============================================
/**
 * Delete user data
 */
app.delete('/api/v1/users/:id', async (req: express.Request, res: express.Response) => {
  // Connect database
  const db = new sqlite3.Database(DB_PATH);
  const id = req.params.id;

  // 現在のユーザー情報を取得する
  db.get(`SELECT * FROM users WHERE id=${id}`, async (err: any, row: any) => {
    if (!row) {
      res.status(404).send({ error: '指定されたユーザーが見つかりません。' });
    } else {
      try {
        await run(`DELETE FROM users WHERE id=${id}`, db);
        res.status(200).send({ message: 'ユーザーを削除しました。' });
      } catch (e) {
        res.status(500).send({ error: e });
      }
    }
  });

  db.close();
});

const port = process.env.PORT || 3000;
app.listen(port);
console.log('Listen on port: ' + port);
