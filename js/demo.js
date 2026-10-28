import { formatUsers, validateUser, filterUsers, sortUsers, findUser, percentMatching } from './users.js';

const show = (title, data) => {
  console.log(`\n=== ${title} ===`);
  console.log(data);
};

const users = formatUsers();
show('1. formatted users', `${users.length} unique users`);
show('1. first user', users[0]);

show('2. validation', users
  .map((user) => ({ name: user.full_name, ...validateUser(user) }))
  .filter((r) => !r.valid)
  .map(({ name, errors }) => ({ name, errors: errors.map(({ field, message }) => `${field} ${message}`) })));

show('3. filter: Ireland / Male / age >= 30', filterUsers(users, { country: 'Ireland', gender: 'male', age: '>=30' }).map((u) => u.full_name));
show('3. filter: favorites', filterUsers(users, { favorite: true }).map((u) => u.full_name));

show('4. sort by age desc', sortUsers(users, 'age', 'desc').map((u) => `${u.full_name} (${u.age})`));
show('4. sort by country asc', sortUsers(users, 'country').map((u) => `${u.full_name} (${u.country})`));
show('4. sort by b_day asc', sortUsers(users, 'b_day').map((u) => `${u.full_name} (${u.b_date?.slice(0, 10)})`));

show('5. find by name "murphy"', findUser(users, { name: 'murphy' })?.full_name);
show('5. find by note "aboba"', findUser(users, { note: 'aboba' })?.full_name);
show('5. find by age 35', findUser(users, { age: 35 })?.full_name);

show('6. percent of users older than 30', `${percentMatching(users, { age: '>30' })}%`);
