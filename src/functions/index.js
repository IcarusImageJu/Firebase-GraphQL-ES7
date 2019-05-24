import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import express from 'express';

import serviceAccount from './config/dad-jokes-ab416-firebase-adminsdk-f6xw7-a444901fac.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dad-jokes-ab416.firebaseio.com"
});

const db = admin.firestore();

import { ApolloServer, gql } from 'apollo-server-express';

const typeDefs = gql`
    type Joke {
        id: ID!,
        joke: String
    }
    type Query {
        jokes: [Joke]
    }
    type Mutation {
        addJoke(joke: String!): Joke
        removeJoke(id: ID!): Boolean
    }
`;

const resolvers = {
    Query: {
        jokes: async () => {
            try {
                const snapshot = await db.collection('jokes').get();
                let array = [];
                snapshot.forEach((doc) => {
                    array.push({id: doc.id, ...doc.data()})
                })
                return array;
            } catch (error) {
                return error;
            }
        }
    },
    Mutation :{
        addJoke: async (_, args) => {
            try {
                const ref = await db.collection('jokes').add(args);
                const joke = {
                    id: ref.id,
                    ...args
                }
                return joke;
            } catch (error) {
                return error;
            }
        },
        removeJoke: async (_, args) => {
            try {
                await db.collection('jokes').doc(args.id).delete();
                return true;
            } catch (error) {
                return false;
            }
        }
    }
}

const app = express();
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
});
server.applyMiddleware({ app, path: "/", cors: true });

exports.graphql = functions.https.onRequest(app);