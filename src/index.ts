import dotenv from 'dotenv';

import app from './server';

dotenv.config();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
