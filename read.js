import neo4j from "neo4j-driver";

const driver = neo4j.driver(
    'bolt://192.168.18.228:7687',
    neo4j.auth.basic('neo4j','12345678')
);
const session =  driver.session({database:'trigger'});

const username = 'user123';
const email = 'user@example.com';

const createUserQuery = `
    CREATE (u:User {
        username: $username,
        email: $email
    })
    RETURN u
`;

const params = {
    username,
    email
};

await session.run(createUserQuery, params);
driver.close();