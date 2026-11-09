# DayFlow

**A clean, modern and intuitive daily planner designed to help you organize tasks, manage your schedule and stay productive.**

DayFlow is a web-based productivity application built with React and TypeScript. It focuses on providing a structured planning experience through task management, date-based organization and an uncluttered interface.

The goal is simple: make daily planning easier, more organized and less overwhelming.

## ✨ Features

- **Task Management** – Organize and manage your daily tasks.
- **Daily Planning** – Structure tasks around specific dates.
- **Upcoming Tasks** – Keep track of tasks scheduled for future dates.
- **Inbox** – A dedicated space for organizing tasks.
- **Date Picker** – Select dates and organize your schedule.
- **Local Data Storage** – Store application data locally using IndexedDB.
- **Data Backup** – Support for backing up your planner data.
- **Modern Interface** – Clean UI with a dark theme and responsive components.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend UI |
| TypeScript | Type safety |
| Vite | Development and build tooling |
| Tailwind CSS | Styling |
| Zustand | State management |
| Dexie.js | IndexedDB database management |
| Lucide React | Icons |

## 📁 Project Structure

```text
DayFlow/
├── public/
│   ├── empty-inbox.png
│   └── logo.svg
├── src/
│   ├── components/
│   │   ├── backup/
│   │   ├── common/
│   │   ├── inbox/
│   │   ├── layout/
│   │   ├── task/
│   │   └── views/
│   ├── db/
│   │   ├── backup.ts
│   │   └── index.ts
│   ├── store/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tests/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/sarveshdevx/DayFlow.git
```

### 2. Navigate to the project

```bash
cd DayFlow
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

### 5. Build for production

```bash
npm run build
```

## 🧪 Testing

Run the available verification scripts using:

```bash
npm test
```

For the date picker tests:

```bash
npm run test:datepicker
```

## 🗺️ Future Plans

DayFlow is an evolving project. Potential future improvements include:

- Improved task scheduling and planning.
- Better productivity insights.
- Enhanced data synchronization and backup.
- AI-powered task management.
- ChatGPT integration to manage tasks using natural language.

## 🤝 Contributing

Suggestions, feedback and contributions are welcome.

Feel free to fork the repository, experiment with the code and submit a pull request.

## 👨‍💻 Author

**Sarvesh Sharma**

GitHub: [@sarveshdevx](https://github.com/sarveshdevx)

---

⭐ If you find this project interesting, consider giving the repository a star!

**DayFlow — Plan your day. Find your flow.**
