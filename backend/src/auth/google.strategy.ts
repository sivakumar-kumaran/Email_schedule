import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { config } from "../config";
import { prisma } from "../db/prisma";

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          const name = profile.displayName || email.split("@")[0];
          const avatarUrl = profile.photos?.[0]?.value;

          // Upsert user
          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              email,
              name,
              avatarUrl,
            },
            create: {
              googleId: profile.id,
              email,
              name,
              avatarUrl,
            },
          });

          // Ensure default sender exists for this user's email
          await prisma.sender.upsert({
            where: {
              userId_address: {
                userId: user.id,
                address: user.email,
              },
            },
            update: {},
            create: {
              userId: user.id,
              address: user.email,
              name: user.name,
            },
          });

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
