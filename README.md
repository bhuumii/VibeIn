<img width="1915" height="978" alt="image" src="https://github.com/user-attachments/assets/0da501db-ccb7-4319-85dc-b8a670981f09" /># VibeIn 🎉
### Discover & Plan Events Across India's Top Cities

VibeIn is a full-stack event discovery and social planning platform that scrapes and aggregates events across major Indian cities — Delhi, Mumbai, Bangalore, Hyderabad, Chandigarh, Pune and many more, letting users discover, plan, and experience their city together.


**🌐 Live Demo:** [vibe-in-rho.vercel.app](https://vibe-in-rho.vercel.app/)  

---

## What Problem Does It Solve?

Finding events in Indian cities is fragmented, you check BookMyShow, Instagram, local community pages, and still miss things. There's no single place to see what's happening around you, and even when you find an event, going alone feels awkward.

**VibeIn solves this in two ways:**
1. **Aggregation** — We scrape public event data from multiple sources so you see everything in one feed.
2. **Social layer** — You don't just find events, you find *people* going to them. Create a "vibe," join a group chat, show up together.

---

## How It Works
[Public Event Sites] → [Scrapers] → [Supabase DB] → [Next.js Frontend] → [Users]
↓
[Claude AI for Itineraries]
↓
[Realtime Chat for Vibes]

### Scraping Approach
- **Public data only** — no login bypass, no paywall circumvention
- **Respectful crawling** — reasonable delays between requests, no server hammering
- **Graceful failures** — if a source is down or changes structure, the rest of the platform keeps working
- Sources: BookMyShow public listings, MeraEvents webiste, local event pages, etc.

---

## Features

### Multi-City Event Discovery
- Browse curated events across many cities
- Filter by 7 categories: Music, Comedy, Fun Activities, Workshops, Arts & Crafts, Theatre, Kids
- Search by title, location, or vibe

### Plan Your Day (AI-Powered)
- Pick a mood: Adventurous, Chill, Social, Cultural, Creative, or Romantic
- Claude AI suggests a personalised itinerary based on your mood and city
- Cart-style picker — add, remove, reorder events
- Save itineraries to your profile

### Vibe with Strangers
- Post an event you're attending and find others going too
- React with Interested or Not interested
- Join a private group chat for the event
- Real-time messaging powered by Supabase Realtime

### Create Your Event
- Any user can host a pop-up, workshop, or meetup
- Events appear live on the homepage under the right city and category
- Full edit and delete control for your own events

### User Profiles
- Custom avatar picker
- City preference personalises your homepage feed
- Edit username, bio, and password

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Backend & DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| AI | Anthropic Claude API (claude-sonnet-4) |
| Scraping | Playwright, BeautifulSoup |
| Deployment | Vercel |

---

## Run Locally

```bash
# Clone the repo
git clone https://github.com/bhuumii/vibein.git
cd vibein

# Install dependencies
npm install


# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

<img width="1842" height="943" alt="image" src="https://github.com/user-attachments/assets/320a4f04-66cc-4499-8fd1-0594130351da" />
<img width="1842" height="943" alt="image" src="https://github.com/user-attachments/assets/69a8d834-28f2-48a8-a661-e0a361f4e607" />


## Future Improvements
- Expand to more cities 
- Improve the use of AI in itinerary creation for smarter, more tailored day plans
- Calendar sync (Google Calendar, Apple Calendar)
- Event recommendations based on attendance history
