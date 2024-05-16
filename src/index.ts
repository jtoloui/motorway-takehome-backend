import app from './server';
import { newConfig } from './config/config';

// Load in config from the env and validate schema is correct before starting the server
const config = newConfig.getInstance().validate().getConfig();

const PORT = config.PORT;

app.listen(PORT, () => {
	config.log.info(`Server is running on http://localhost:${PORT}`);
});
