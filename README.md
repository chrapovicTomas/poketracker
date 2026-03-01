#  PokeTracker - Pokémon TCG Portfolio Tracker
PokeTracker is a modern web application built with Next.js that allows collectors and investors to effortlessly track the value of their Pokémon TCG (Trading Card Game) collections. 
Rather than manually checking prices, PokeTracker lets you add your cards or sealed products, and uses an automated web scraper to fetch real-time market prices directly from TCGPlayer.
## Features
- **Portfolio Dashboard**: View your total collection value, total investment (buy price), and calculate your overall profit or loss.
- **Automated Price Scraping**: Built-in web scraper using Puppeteer and Cheerio to fetch the latest market prices from TCGPlayer URLs.
- **Price History Charts**: Visualizes the price trend of your tracked items over time using Recharts.
- **Categorization**: Group items by type (Single Cards, Booster Packs, Elite Trainer Boxes, Booster Bundles, etc.).
- **User Authentication**: Secure user login and registration powered by NextAuth.js.
- **Responsive UI**: A beautiful, glassmorphism-inspired dark mode interface that works seamlessly on desktop and mobile.
##  Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: SQLite (Local development)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Scraping**: [Puppeteer Extra](https://github.com/berstend/puppeteer-extra) (with Stealth Plugin) + Cheerio + Cloudscraper
- **Charts**: [Recharts](https://recharts.org/)

##  Getting Started
### Prerequisites
Make sure you have Node.js (v18+ recommended) installed on your machine.
### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/chrapovicTomas/poketracker.git
   cd pokemon

2. Install the dependencies:
   ```bash
   npm install

3. Initialize the Database:
   ```bash
   npx prisma db push

4. Run the development server:
   ```bash
   npm run dev
