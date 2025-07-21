# BYR3D

**BYR3D** is a simple platform focused on room layout editor. It features a smooth, user-friendly interface with engaging animations.

---

## Features

* **Reusable Components:** Modular components for easy maintenance and extension.
* **Dynamic Mouse-mmovement Animations:** Utilizes THREE.js and scroll events to animate interactive background.
* **Backend Powered by Django:** Robust API layer for handling room data and future extensibility.
* **Easy to Extend:** Foundation ready for adding project, screenshots, authentication, and posting in community.

---

## Tech Stack

### Frontend

* HTML, CSS, and Javascript

### Backend

* Django

### Development Tools

* Visual Studio Code
* Git & GitHub for version control

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/dailysip.git
cd dailysip
```

### 2. Set Up the Backend

```bash
cd backend
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Set Up the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Visit the App

Go to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Future Improvements

* Add product listing pages with filters and categories
* Implement shopping cart and checkout process
* Integrate payment gateways
* Add data analytics
* Improve product data fetching and state management with Redux or Context API
