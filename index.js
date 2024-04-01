const express = require("express");
const mysql = require("mysql2/promise");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(express.json());

const port = 8000;

let conn = null;

// function init connection mysql
const initMySQL = async () => {
  conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "tutorial",
  });
};

// use sequenlize mysql
// const sequelize = new Sequelize("tutorial", "root", "root", {
//   host: "localhost",
//   dialect: "mysql",
// });

// use sequelize postgres
const sequelize = new Sequelize("mydatabase", "user", "password", {
    host: "localhost",
    dialect: "postgres",
});

/* เราจะเพิ่ม code ส่วนนี้กัน */
const User = sequelize.define(
  "User",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {}
);

const Address = sequelize.define(
  "Addresses",
  {
    address1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {}
);

User.hasMany(Address, { onDelete : 'CASCADE'}); // 1 to many
Address.belongsTo(User); // 1 to 1

// API เพิ่ม User
app.post("/api/users", async (req, res) => {
  const userData = req.body;
  const addresses = userData.addresses;

  try {
    const user = await User.create(userData);
    const address = [];
    for (let i = 0; i < addresses.length; i++) {
      addresses[i].UserId = user.id;
      let addressCreated = await Address.create(addresses[i]);
      address.push(addressCreated);
    }
    res.status(200).json({user, address});
  } catch (error) {
    res.status(400).json({ message : error });
  }
});

// API ดึงข้อมูล User ทั้งหมด
app.get("/api/users", async (req, res) => {
    const users = await User.findAll({
        include: Address,
    });
    res.json(users);
});

// API ดึงข้อมูล User ตาม id
app.get("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    const result = await User.findOne({
        where: { id: userId },
        include: {
            model: Address,
        },
    });
    res.json(result);
});

// API update User ตาม id
app.put("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    const userData = req.body;
    try {
        const user = await User.update(userData, {where: { id: userId }});
        const addresses = userData.addresses;
        let address = [];
        for (let i = 0; i < addresses.length; i++) {
            let cAddressData = addresses[i];
            cAddressData.UserId = userId;
            const addressCreated = await Address.upsert(cAddressData); // ถ้าไม่มีข้อมูลจะ insert ใหม่ ถ้ามีข้อมูลจะ update
            address.push(addressCreated);
        }

        res.status(201).json({user, address});
    } catch (error) {
        res.status(400).json({ message: 'update error' });
    }
});

// API delete User ตาม id
app.delete("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    try {
        await User.destroy({ where: { id: userId } });
        res.status(204).json({ message: 'delete success' });
    } catch (error) {
        res.status(400).json({ message: 'delete error' });
    }
});

// Listen
app.listen(port, async () => {
  await initMySQL();
  await sequelize.sync();

  console.log("Server started at port 8000");
});
