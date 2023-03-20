import { Prisma } from "@prisma/client";
import { CreateUsernameResponse, GraphQLContext } from "../../util/types";

const resolvers = {
    Query: {
        searchUsers: () => {},
    },
    Mutation: {
        createUsername: async (_: any, args: {username: string}, 
            context: GraphQLContext): 
            Promise<CreateUsernameResponse> => {
            const {username} = args;
            const {prisma, session} = context;
            if (!session?.user) {
                return {
                    error: "Não autorizado",
                }
            }
            const {id: userId} = session.user;
            try {
                /**
                 * ver se o usuario n ta sendo usado 
                 */
                const existingUser = await prisma.user.findUnique({
                    where: {
                        username,
                    }
                });
                if (existingUser) {
                    return {
                        error: "Nome de usuário já utilizado. Por favor insira outro"
                    }
                }
                /**
                 * colocar usuario
                 */
                await prisma.user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        username
                    },
                });
                return {success: true};
            } catch (error: any) {
                console.log("createUsername error", error);
                return {
                    error: error?.message,
                }
            }
        },
    },
};

export default resolvers;