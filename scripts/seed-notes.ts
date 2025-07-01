import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env.local file (Next.js standard)
dotenv.config({ path: '.env.local' });

// Fallback to .env if .env.local doesn't exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: '.env' });
}

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_AI_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!googleApiKey) {
  console.error('Missing required environment variable: GOOGLE_AI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Google AI for embeddings
const genAI = new GoogleGenerativeAI(googleApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Sample user ID - you'll need to replace this with a real user ID from your auth.users table
// const SAMPLE_USER_ID = '00000000-0000-0000-0000-000000000000'; // Replace with actual user ID
const SAMPLE_USER_ID = '8ac6bb74-99e7-4d83-a8e0-786b93d3dee4';

interface NoteData {
  user_id: string;
  content: string;
  key_context?: string;
  contexts?: string[];
  tags?: string[];
  note_type?: string;
  suggested_contexts?: string[];
  created_at?: string;
  updated_at?: string;
}

// Helper function to convert date string to ISO timestamp
function dateToTimestamp(dateStr: string): string {
  const [day, month, year] = dateStr.split('-');
  const monthIndex = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  };
  const date = new Date(parseInt(year), monthIndex[month.toLowerCase() as keyof typeof monthIndex], parseInt(day));
  return date.toISOString();
}

// Function to generate document embedding with optimized prompt
async function generateDocumentEmbedding(
  content: string,
  contexts?: string[],
  tags?: string[],
  noteType?: string
): Promise<number[]> {
  try {
    const contextText = contexts && contexts.length > 0 ? `\nContexts: ${contexts.join(", ")}` : "";
    const tagsText = tags && tags.length > 0 ? `\nTags: ${tags.join(", ")}` : "";
    const typeText = noteType ? `\nType: ${noteType}` : "";

    const prompt = `Document for retrieval:
Content: ${content}${contextText}${tagsText}${typeText}

This is a document that should be retrieved when users ask questions about: ${content}${contextText}${tagsText}${typeText}`;

    const result = await embeddingModel.embedContent(prompt);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to batch update notes with embeddings
async function updateNotesWithEmbeddings(notes: any[]) {
  console.log(`Generating embeddings for ${notes.length} notes...`);

  const batchSize = 5; // Process in batches to avoid rate limits
  const updatedNotes = [];

  for (let i = 0; i < notes.length; i += batchSize) {
    const batch = notes.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(notes.length / batchSize)}...`);

    const batchPromises = batch.map(async (note) => {
      try {
        const embedding = await generateDocumentEmbedding(
          note.content,
          note.contexts,
          note.tags,
          note.note_type
        );

        return {
          id: note.id,
          embedding,
          embedding_model: 'text-embedding-004',
          embedding_created_at: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Error generating embedding for note ${note.id}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter(result => result !== null);
    updatedNotes.push(...validResults);

    // Add a small delay between batches to be respectful to the API
    if (i + batchSize < notes.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return updatedNotes;
}

const seedNotes: NoteData[] = [
  // 1. Meeting Notes with Work Context
  {
    user_id: SAMPLE_USER_ID,
    content: `# Weekly Team Standup - [[work]] [[meeting]]

## Agenda
- Project updates
- Blockers discussion
- Next week planning

## Key Points
- Frontend team completed the new dashboard [[frontend]]
- Backend API integration is 80% complete [[backend]] [[api]]
- Need to discuss the new feature requirements with the product team

## Action Items
- [ ] Schedule meeting with product team [[product]]
- [ ] Review pull requests by EOD
- [ ] Update project timeline

## Notes
The team is making good progress on the Q2 objectives. The new dashboard feature is particularly well-received by stakeholders.`,
    key_context: '15-june-2025',
    contexts: ['15-june-2025', 'work', 'meeting', 'frontend', 'backend', 'api', 'product'],
    tags: ['standup', 'weekly', 'team'],
    note_type: 'note',
    suggested_contexts: ['project-management', 'team-collaboration', 'sprint-planning'],
    created_at: dateToTimestamp('15-june-2025'),
    updated_at: dateToTimestamp('15-june-2025')
  },

  // 2. Personal Journal Entry
  {
    user_id: SAMPLE_USER_ID,
    content: `Today was quite productive! [[personal]] [[journal]]

Started the day with a morning walk in the park [[health]] [[exercise]]. The weather was perfect - sunny but not too hot. Saw some interesting birds and even spotted a rabbit!

Work was busy but manageable. Finally finished that challenging bug fix that had been bothering me for days. [[work]] [[coding]] The solution was much simpler than I initially thought - sometimes you just need to step back and look at the problem from a different angle.

Had dinner with friends tonight [[social]]. We tried that new Italian restaurant downtown. The pasta was amazing! Made plans to go hiking next weekend [[outdoors]] [[hiking]].

Feeling grateful for good health, good friends, and meaningful work.`,
    key_context: '16-june-2025',
    contexts: ['16-june-2025', 'personal', 'journal', 'health', 'exercise', 'work', 'coding', 'social', 'outdoors', 'hiking'],
    tags: ['daily', 'reflection', 'gratitude'],
    note_type: 'note',
    suggested_contexts: ['wellness', 'relationships', 'work-life-balance'],
    created_at: dateToTimestamp('16-june-2025'),
    updated_at: dateToTimestamp('16-june-2025')
  },

  // 3. Technical Documentation
  {
    user_id: SAMPLE_USER_ID,
    content: `# API Authentication Implementation [[tech]] [[documentation]]

## Overview
Implementing JWT-based authentication for our REST API [[api]] [[authentication]].

## Implementation Steps

### 1. JWT Token Generation
\`\`\`javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
\`\`\`

### 2. Middleware Setup
\`\`\`javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
\`\`\`

## Security Considerations
- Always use HTTPS in production [[security]]
- Implement token refresh mechanism
- Set appropriate expiration times
- Store secrets securely

## Testing
- Unit tests for token generation
- Integration tests for protected routes
- Load testing for authentication endpoints

## Resources
- [JWT.io](https://jwt.io/) for token debugging
- [Auth0 documentation](https://auth0.com/docs) for best practices`,
    key_context: '17-june-2025',
    contexts: ['17-june-2025', 'tech', 'documentation', 'api', 'authentication', 'security'],
    tags: ['jwt', 'auth', 'backend', 'security'],
    note_type: 'note',
    suggested_contexts: ['backend-development', 'security-implementation', 'api-design'],
    created_at: dateToTimestamp('17-june-2025'),
    updated_at: dateToTimestamp('17-june-2025')
  },

  // 4. Recipe Notes
  {
    user_id: SAMPLE_USER_ID,
    content: `# Grandma's Chocolate Chip Cookies [[cooking]] [[recipe]]

## Ingredients
- 2 1/4 cups all-purpose flour
- 1 tsp baking soda
- 1 tsp salt
- 1 cup (2 sticks) butter, softened
- 3/4 cup granulated sugar
- 3/4 cup packed brown sugar
- 2 large eggs
- 2 tsp vanilla extract
- 2 cups chocolate chips

## Instructions
1. Preheat oven to 375°F (190°C)
2. Mix flour, baking soda, and salt in small bowl
3. Beat butter, granulated sugar, and brown sugar until creamy
4. Add eggs and vanilla; beat well
5. Gradually mix in flour mixture
6. Stir in chocolate chips
7. Drop by rounded tablespoon onto ungreased baking sheets
8. Bake 9 to 11 minutes or until golden brown
9. Cool on baking sheets for 2 minutes; remove to wire racks

## Tips
- Don't overmix the dough
- Let butter come to room temperature naturally
- Use high-quality chocolate chips for best results
- Store in airtight container to maintain freshness

## Variations
- Add 1 cup chopped nuts [[nuts]]
- Substitute white chocolate chips
- Add 1 tsp cinnamon for a twist

This recipe has been in our family for generations! [[family]] [[tradition]]`,
    key_context: '18-june-2025',
    contexts: ['18-june-2025', 'cooking', 'recipe', 'nuts', 'family', 'tradition'],
    tags: ['dessert', 'baking', 'chocolate', 'cookies'],
    note_type: 'note',
    suggested_contexts: ['baking-tips', 'family-recipes', 'dessert-variations'],
    created_at: dateToTimestamp('18-june-2025'),
    updated_at: dateToTimestamp('18-june-2025')
  },

  // 5. Book Notes
  {
    user_id: SAMPLE_USER_ID,
    content: `# "Atomic Habits" by James Clear [[reading]] [[book-notes]]

## Key Concepts

### The Four Laws of Behavior Change
1. **Make it obvious** - Cue
2. **Make it attractive** - Craving
3. **Make it easy** - Response
4. **Make it satisfying** - Reward

### Identity-Based Habits
The most effective way to change habits is to focus on who you want to become, not what you want to achieve. [[self-improvement]] [[habits]]

### The 1% Rule
Improving by just 1% each day leads to remarkable results over time. Small changes compound into massive differences.

## Favorite Quotes
> "You do not rise to the level of your goals. You fall to the level of your systems."

> "Every action you take is a vote for the type of person you wish to become."

## Action Items
- [ ] Create a habit tracker [[productivity]]
- [ ] Design my environment for better habits
- [ ] Start with one small habit change
- [ ] Track progress daily

## Related Books
- "The Power of Habit" by Charles Duhigg
- "Tiny Habits" by BJ Fogg

This book completely changed how I think about personal development! [[personal-development]]`,
    key_context: '19-june-2025',
    contexts: ['19-june-2025', 'reading', 'book-notes', 'self-improvement', 'habits', 'productivity', 'personal-development'],
    tags: ['non-fiction', 'self-help', 'productivity', 'habits'],
    note_type: 'note',
    suggested_contexts: ['behavioral-psychology', 'goal-setting', 'personal-growth'],
    created_at: dateToTimestamp('19-june-2025'),
    updated_at: dateToTimestamp('19-june-2025')
  },

  // 6. Travel Planning
  {
    user_id: SAMPLE_USER_ID,
    content: `# Japan Trip Planning [[travel]] [[planning]]

## Trip Details
- **Dates**: March 15-30, 2024
- **Duration**: 15 days
- **Cities**: Tokyo, Kyoto, Osaka, Hiroshima

## Must-See Attractions

### Tokyo [[tokyo]]
- Senso-ji Temple
- Shibuya Crossing
- Tsukiji Outer Market
- Tokyo Skytree
- Meiji Shrine

### Kyoto [[kyoto]]
- Fushimi Inari Shrine
- Arashiyama Bamboo Grove
- Kinkaku-ji (Golden Pavilion)
- Gion District
- Philosopher's Path

### Osaka [[osaka]]
- Dotonbori
- Osaka Castle
- Universal Studios Japan
- Kuromon Ichiba Market

### Hiroshima [[hiroshima]]
- Peace Memorial Park
- Miyajima Island
- Atomic Bomb Dome

## Accommodation
- Tokyo: Hotel in Shibuya area
- Kyoto: Traditional ryokan
- Osaka: Hotel near Dotonbori
- Hiroshima: Hotel near Peace Park

## Transportation
- Japan Rail Pass for 7 days
- IC cards for local transport
- Shinkansen between cities

## Budget
- Flights: $800
- Accommodation: $1,200
- Food: $600
- Activities: $400
- Transport: $300
- **Total**: ~$3,300

## Packing List
- Comfortable walking shoes
- Lightweight clothing
- Portable charger
- Travel adapter
- Japanese phrasebook

So excited for this adventure! [[adventure]] [[culture]]`,
    key_context: '20-june-2025',
    contexts: ['20-june-2025', 'travel', 'planning', 'tokyo', 'kyoto', 'osaka', 'hiroshima', 'adventure', 'culture'],
    tags: ['japan', 'vacation', 'international', 'culture'],
    note_type: 'note',
    suggested_contexts: ['japanese-culture', 'budget-travel', 'itinerary-planning'],
    created_at: dateToTimestamp('20-june-2025'),
    updated_at: dateToTimestamp('20-june-2025')
  },

  // 7. Simple Task List
  {
    user_id: SAMPLE_USER_ID,
    content: `# Weekend To-Do List [[tasks]] [[personal]]

## Saturday
- [ ] Grocery shopping [[errands]]
- [ ] Laundry [[household]]
- [ ] Call mom [[family]]
- [ ] Finish reading that book [[reading]]
- [ ] Go for a run [[exercise]]

## Sunday
- [ ] Meal prep for the week [[cooking]]
- [ ] Clean apartment [[household]]
- [ ] Review work emails [[work]]
- [ ] Plan next week [[planning]]
- [ ] Watch the new episode of that show [[entertainment]]

## Notes
Need to remember to buy:
- Milk
- Bread
- Eggs
- Vegetables
- Coffee

Also need to schedule dentist appointment for next month [[health]].`,
    key_context: '21-june-2025',
    contexts: ['21-june-2025', 'tasks', 'personal', 'errands', 'household', 'family', 'reading', 'exercise', 'cooking', 'work', 'planning', 'entertainment', 'health'],
    tags: ['weekend', 'chores', 'planning'],
    note_type: 'note',
    suggested_contexts: ['time-management', 'household-tasks', 'weekend-planning'],
    created_at: dateToTimestamp('21-june-2025'),
    updated_at: dateToTimestamp('21-june-2025')
  },

  // 8. Learning Notes
  {
    user_id: SAMPLE_USER_ID,
    content: `# React Hooks Deep Dive [[learning]] [[programming]]

## useState Hook
The most basic hook for managing state in functional components.

\`\`\`javascript
const [state, setState] = useState(initialValue);
\`\`\`

**Key Points:**
- State updates are asynchronous
- Always use the functional update form for state that depends on previous state
- State updates trigger re-renders

## useEffect Hook
Handles side effects in functional components.

\`\`\`javascript
useEffect(() => {
  // Side effect code
  return () => {
    // Cleanup code
  };
}, [dependencies]);
\`\`\`

**Common Use Cases:**
- API calls [[api]]
- Event listeners
- Subscriptions
- DOM manipulation

## Custom Hooks
Create reusable stateful logic:

\`\`\`javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}
\`\`\`

## Best Practices
- Always include dependencies in useEffect
- Use multiple useEffect hooks instead of one complex one
- Clean up subscriptions and event listeners
- Don't call hooks inside loops, conditions, or nested functions

## Resources
- React documentation
- Dan Abramov's blog posts
- React DevTools for debugging

Need to practice more with useContext and useReducer! [[react]] [[frontend]]`,
    key_context: '22-june-2025',
    contexts: ['22-june-2025', 'learning', 'programming', 'api', 'react', 'frontend'],
    tags: ['react', 'hooks', 'javascript', 'frontend'],
    note_type: 'note',
    suggested_contexts: ['react-development', 'javascript-learning', 'frontend-patterns'],
    created_at: dateToTimestamp('22-june-2025'),
    updated_at: dateToTimestamp('22-june-2025')
  },

  // 9. Health & Fitness
  {
    user_id: SAMPLE_USER_ID,
    content: `# Workout Plan - Week 3 [[fitness]] [[health]]

## Monday - Upper Body
- Push-ups: 3 sets x 15 reps
- Pull-ups: 3 sets x 8 reps
- Dumbbell rows: 3 sets x 12 reps each arm
- Shoulder press: 3 sets x 10 reps
- Bicep curls: 3 sets x 12 reps

## Tuesday - Cardio
- 30 minutes running [[cardio]]
- 15 minutes cycling
- 10 minutes stretching

## Wednesday - Lower Body
- Squats: 4 sets x 15 reps
- Lunges: 3 sets x 12 reps each leg
- Deadlifts: 3 sets x 10 reps
- Calf raises: 3 sets x 20 reps
- Planks: 3 sets x 60 seconds

## Thursday - Rest Day
- Light stretching
- Walking 30 minutes

## Friday - Full Body
- Burpees: 3 sets x 10 reps
- Mountain climbers: 3 sets x 30 seconds
- Jump squats: 3 sets x 15 reps
- Push-ups: 3 sets x 12 reps
- Planks: 3 sets x 45 seconds

## Saturday - Cardio
- 45 minutes swimming [[swimming]]
- 15 minutes stretching

## Sunday - Rest Day
- Yoga session [[yoga]]
- Meditation 20 minutes

## Progress Notes
- Weight: 165 lbs (down 2 lbs from last week)
- Energy levels: Much better
- Sleep quality: Improved
- Mood: More positive

## Goals for Next Week
- Increase push-up reps to 18
- Add 5 minutes to cardio sessions
- Try a new yoga class

Feeling stronger and more energized! [[motivation]] [[wellness]]`,
    key_context: '23-june-2025',
    contexts: ['23-june-2025', 'fitness', 'health', 'cardio', 'swimming', 'yoga', 'motivation', 'wellness'],
    tags: ['workout', 'strength', 'cardio', 'progress'],
    note_type: 'note',
    suggested_contexts: ['strength-training', 'cardio-workouts', 'fitness-progress'],
    created_at: dateToTimestamp('23-june-2025'),
    updated_at: dateToTimestamp('23-june-2025')
  },

  // 10. Simple Note with Contexts
  {
    user_id: SAMPLE_USER_ID,
    content: `Had a great conversation with Sarah today about the new project. [[work]] [[colleague]] She had some really insightful ideas about the user interface design. [[ui]] [[design]]

We discussed the color scheme and layout options. She suggested using a more minimalist approach which I think would work well. [[minimalism]]

Need to follow up with the development team tomorrow to discuss the technical feasibility. [[development]] [[meeting]]`,
    key_context: '24-june-2025',
    contexts: ['24-june-2025', 'work', 'colleague', 'ui', 'design', 'minimalism', 'development', 'meeting'],
    tags: ['conversation', 'project', 'design'],
    note_type: 'note',
    suggested_contexts: ['team-collaboration', 'design-thinking', 'project-management'],
    created_at: dateToTimestamp('24-june-2025'),
    updated_at: dateToTimestamp('24-june-2025')
  },

  // 11. Unstructured: Grocery List
  {
    user_id: SAMPLE_USER_ID,
    content: `Grocery list for the week: apples, bananas, spinach, milk, eggs, bread, coffee. Don't forget to check for discounts on cereal.`,
    key_context: '25-june-2025',
    contexts: ['25-june-2025', 'grocery', 'shopping'],
    tags: ['groceries', 'shopping'],
    note_type: 'note',
    suggested_contexts: ['shopping', 'meal-prep'],
    created_at: dateToTimestamp('25-june-2025'),
    updated_at: dateToTimestamp('25-june-2025')
  },

  // 12. Unstructured: Quick Thought
  {
    user_id: SAMPLE_USER_ID,
    content: `Why do cats always find the sunniest spot in the house? Must be nice to be a cat.`,
    key_context: '26-june-2025',
    contexts: ['26-june-2025', 'thoughts', 'cats'],
    tags: ['random', 'pets'],
    note_type: 'note',
    suggested_contexts: ['musings'],
    created_at: dateToTimestamp('26-june-2025'),
    updated_at: dateToTimestamp('26-june-2025')
  },

  // 13. Unstructured: Work Reminder
  {
    user_id: SAMPLE_USER_ID,
    content: `Remember to send the quarterly report to finance by Friday. Ask John for the latest numbers.`,
    key_context: '27-june-2025',
    contexts: ['27-june-2025', 'work', 'reminder'],
    tags: ['work', 'reminder'],
    note_type: 'note',
    suggested_contexts: ['work-tasks'],
    created_at: dateToTimestamp('27-june-2025'),
    updated_at: dateToTimestamp('27-june-2025')
  },

  // 14. Unstructured: Dream Log
  {
    user_id: SAMPLE_USER_ID,
    content: `Dreamt I was flying over a city made of glass. Woke up feeling inspired and a little confused.`,
    key_context: '28-june-2025',
    contexts: ['28-june-2025', 'dream', 'personal'],
    tags: ['dream', 'journal'],
    note_type: 'note',
    suggested_contexts: ['dream-journal'],
    created_at: dateToTimestamp('28-june-2025'),
    updated_at: dateToTimestamp('28-june-2025')
  },

  // 15. Unstructured: Fitness Progress
  {
    user_id: SAMPLE_USER_ID,
    content: `Ran 5km in 28 minutes today. Felt strong, but need to stretch more before running.`,
    key_context: '29-june-2025',
    contexts: ['29-june-2025', 'fitness', 'running'],
    tags: ['fitness', 'progress'],
    note_type: 'note',
    suggested_contexts: ['running', 'fitness-tracking'],
    created_at: dateToTimestamp('29-june-2025'),
    updated_at: dateToTimestamp('29-june-2025')
  },

  // 16. Unstructured: Movie Reaction
  {
    user_id: SAMPLE_USER_ID,
    content: `Watched "The Grand Budapest Hotel". Loved the colors and quirky characters. Wes Anderson's style is so unique!`,
    key_context: '30-june-2025',
    contexts: ['30-june-2025', 'movies', 'entertainment'],
    tags: ['movies', 'review'],
    note_type: 'note',
    suggested_contexts: ['movie-reviews'],
    created_at: dateToTimestamp('30-june-2025'),
    updated_at: dateToTimestamp('30-june-2025')
  },

  // 17. Unstructured: Weather Note
  {
    user_id: SAMPLE_USER_ID,
    content: `It rained all afternoon. Streets were empty, and the air smelled fresh. Perfect day for reading indoors.`,
    key_context: '1-july-2025',
    contexts: ['1-july-2025', 'weather', 'personal'],
    tags: ['weather', 'mood'],
    note_type: 'note',
    suggested_contexts: ['weather-journal'],
    created_at: dateToTimestamp('1-july-2025'),
    updated_at: dateToTimestamp('1-july-2025')
  }
];

async function runSeedNotes() {
  console.log('Starting to seed notes...');

  try {
    // Insert all notes
    const { data, error } = await supabase
      .from('notes')
      .insert(seedNotes)
      .select();

    if (error) {
      console.error('Error seeding notes:', error);
      return;
    }

    console.log(`Successfully seeded ${data?.length || 0} notes!`);
    console.log('Note IDs:', data?.map(note => note.id));

    // Update notes with embeddings
    const updatedNotes = await updateNotesWithEmbeddings(data);

    if (updatedNotes.length > 0) {
      console.log(`Updating ${updatedNotes.length} notes with embeddings...`);

      // Update each note individually
      for (const noteUpdate of updatedNotes) {
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            embedding: noteUpdate.embedding,
            embedding_model: noteUpdate.embedding_model,
            embedding_created_at: noteUpdate.embedding_created_at,
          })
          .eq('id', noteUpdate.id);

        if (updateError) {
          console.error(`Error updating note ${noteUpdate.id}:`, updateError);
        }
      }

      console.log(`Successfully updated ${updatedNotes.length} notes with embeddings!`);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the seed function
runSeedNotes()
  .then(() => {
    console.log('Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });