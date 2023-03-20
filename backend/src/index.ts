import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import {getSession} from 'next-auth/react' 
import {makeExecutableSchema} from "@graphql-tools/schema";
import { json } from 'body-parser';
import {PrismaClient} from '@prisma/client'
import  typeDefs  from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import * as dotenv from 'dotenv';
import { GraphQLContext, Session } from './util/types';

interface MyContext {
  token?: String;
}

async function main() {
  dotenv.config();
  const app = express();
  const httpServer = http.createServer(app);
  const schema = makeExecutableSchema ({
    typeDefs,
    resolvers,
  })

  
  const server = new ApolloServer<MyContext>({
    schema,
    csrfPrevention: true,
    cache: "bounded",
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }),
             ApolloServerPluginLandingPageLocalDefault({embed: true}),
            ],
  });

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}
const prisma = new PrismaClient();

  await server.start();
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req, res}): Promise<GraphQLContext> => {
        const session = await getSession({req}) as Session;
        return {session, prisma};}
      
    }
      ),
  );

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000/graphql`);
}
main().catch((err) => console.log(err));