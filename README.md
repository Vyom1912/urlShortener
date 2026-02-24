# URL Shortener

do
npm install dotenv express mongodb ejs zod

run: npm run dev

# 🔗 URL Shortener

A simple URL Shortener application built using **Node.js**, **Express**, **MongoDB Atlas**, and **EJS**.  
It allows users to convert long URLs into short, shareable links and redirect them back to the original URL.

---

## ✨ Features

- Shorten long URLs
- Custom short code support
- Redirect short URLs to original URLs
- MongoDB Atlas integration
- MVC folder structure
- Environment variable validation using Zod

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB (Atlas)**
- **MongoDB Native Driver**
- **EJS**
- **Zod**
- **dotenv**

---

## 📁 Project Structure

```txt
app.js
.env.example
.gitignore
README.md

config/
 ├── db.js
 └── env.js

routes/
 └── shortener.routes.js
 └──auth.routes.js

controllers/
 └── shortener.controller.js
 └── auth.controllers.js

services/
 └── shortener.services.js
 └── auth.services.js

middlewares/
 └── auth.middlewares.js

views/
 └──auth/
    └── login.ejs
    └── register.ejs
 └──partials/
    └── header.ejs
    └── footer.ejs
 └──404.ejs
 └── index.ejs

validators/
 └── auth.validator.js
 └── shortener.validator.js

public/
 └── style.css

app.js
package-lock.json
package.json
.env.example
README.md
.gitignore
```
