require(`dotenv`).config();
const express = require(`express`);
const dbStartup = require('./app/startups/dbStartup');

const app = express();
app.use(express.json());

const profileRouter = require(`./app/routes/profile`);

app.use(`/profile`, profileRouter);

/** Defines startup logic
 */
async function startApplication() {
    try {
        await dbStartup();
    } catch (err) {
        console.log(`Error starting the server\n${err.message}`);
        process.exit(1);
    }
}

startApplication().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server started on port ${process.env.PORT}`);
    });
});
