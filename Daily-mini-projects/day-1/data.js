/**
 * data.js
 * 50 fake employee objects — each has: name, age, role, salary.
 *
 * Generated deterministically so you always get the same dataset.
 * Roles intentionally distributed unevenly to make filter results interesting.
 */

const ROLES = ["Engineer", "Designer", "Manager", "Analyst", "DevOps", "Marketing"];

const FIRST_NAMES = [
  "Amina","Liam","Sofia","Noah","Zara","Ethan","Maya","Lucas","Nia","Aiden",
  "Fatima","James","Leila","Oliver","Chloe","Elijah","Sara","Mason","Layla","Logan",
  "Yuki","Mateo","Priya","Jack","Aisha","Samuel","Elena","Henry","Mia","David",
  "Nour","Sebastian","Hana","Leo","Imani","Jacob","Rima","Alexander","Clara","Daniel",
  "Kira","Michael","Ifeoma","Owen","Sasha","Nathan","Dalia","Isaac","Vera","Ryan"
];

const LAST_NAMES = [
  "Hassan","Smith","Garcia","Brown","Wilson","Davis","Martinez","Johnson","Taylor","Anderson",
  "Moore","Jackson","White","Harris","Thompson","Walker","Robinson","Lewis","Lee","Hall",
  "Allen","Young","Hernandez","King","Wright","Scott","Torres","Green","Adams","Baker",
  "Gonzalez","Nelson","Carter","Mitchell","Perez","Roberts","Turner","Phillips","Campbell","Parker",
  "Evans","Edwards","Collins","Stewart","Sanchez","Morris","Rogers","Reed","Cook","Morgan"
];

/**
 * Build the dataset.
 *
 * We use a simple seeded pattern so salaries and ages look realistic
 * without a random-seed library.
 */
const USERS = FIRST_NAMES.map((first, i) => {
  const role    = ROLES[i % ROLES.length];
  const age     = 22 + ((i * 7 + 3) % 38);          // 22 – 59
  const base    = { Engineer: 95, Designer: 80, Manager: 110,
                    Analyst: 75, DevOps: 100, Marketing: 70 }[role];
  const salary  = (base + ((i * 13) % 40)) * 1000;   // realistic band per role
  return { id: i + 1, name: `${first} ${LAST_NAMES[i]}`, age, role, salary };
});
