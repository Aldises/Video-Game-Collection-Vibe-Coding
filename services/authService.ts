import { AuthCredentials, User } from '../types';

// MOCK DATABASE - In a real app, this logic would be on your backend server.
const DB_KEY = 'mockUserDB';
const getDb = () => {
  const db = localStorage.getItem(DB_KEY);
  return db ? JSON.parse(db) : {};
};
const saveDb = (db: any) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};
// --- END OF MOCK DATABASE ---

export const signUp = async ({ email, password }: AuthCredentials): Promise<User> => {
  // In a real app, you would make a POST request to your backend API.
  // The backend would handle hashing the password and creating a new user in MongoDB.
  /*
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Sign up failed.');
  }
  
  const { user } = await response.json();
  return user;
  */

  // --- MOCK IMPLEMENTATION ---
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getDb();
      if (db[email]) {
        return reject(new Error('Email already exists.'));
      }
      db[email] = { password, collection: [], wishlist: [] };
      saveDb(db);
      
      const user = { uid: email, email };
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      resolve(user);
    }, 500);
  });
};

export const signIn = async ({ email, password }: AuthCredentials): Promise<User> => {
    // In a real app, you would make a POST request to your backend API.
    // The backend would validate credentials against MongoDB and return a user object.
    /*
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid email or password.');
    }
    
    const { user } = await response.json();
    return user;
    */

    // --- MOCK IMPLEMENTATION ---
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const db = getDb();
            const userData = db[email];
            if (!userData || userData.password !== password) {
                return reject(new Error('Invalid email or password.'));
            }
            const user = { uid: email, email };
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            resolve(user);
        }, 500);
    });
};

export const signOut = async (): Promise<void> => {
    // In a real app, you might call a backend endpoint to invalidate a session token.
    // For a simple session, clearing client-side storage is often sufficient.
    /*
    await fetch('/api/auth/signout', { method: 'POST' });
    */

    // --- MOCK IMPLEMENTATION ---
    return new Promise((resolve) => {
        setTimeout(() => {
            // Per user request, clear localStorage on logout.
            // In this mock app, this deletes all users and their data.
            localStorage.clear();
            resolve();
        }, 200);
    });
};