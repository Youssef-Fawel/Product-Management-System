const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');

async function initializeUsersFile() {
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, '[]');
    }
}

async function readUsers() {
    await initializeUsersFile();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
}

async function writeUsers(users) {
    const tempFile = `${USERS_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(users, null, 2));
    await fs.rename(tempFile, USERS_FILE);
}

router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const users = await readUsers();

        const emailExists = users.some(user => 
            user.email.toLowerCase() === email.toLowerCase()
        );
        if (emailExists) {
            return res.status(409).json({
                field: 'email',
                message: 'Cette adresse email est déjà utilisée'
            });
        }

        const nameExists = users.some(user => 
            user.fullName.toLowerCase() === fullName.toLowerCase()
        );
        if (nameExists) {
            return res.status(409).json({
                field: 'fullName',
                message: 'Ce nom est déjà utilisé'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now(),
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        };

        users.push(newUser);
        await writeUsers(users);
        res.status(201).json({ message: 'Compte créé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
