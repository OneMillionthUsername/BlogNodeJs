# Blog Application

A modern blog platform with WYSIWYG editor and admin functionality.

## Installation

1. Clone repository:
   ```bash
   git clone [repository-url]
   cd Blog
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

4. Start server:
   ```bash
   npm start
   ```

5. Open browser: `http://localhost:3000`

## Features

- WYSIWYG editor with TinyMCE
- JWT-based admin authentication
- MariaDB database integration
- Responsive design
- SSL/HTTPS support
- File upload capabilities
- Comment system
- Analytics and view tracking

## Configuration

### Environment Variables (.env)
```bash
NODE_ENV=production
PLESK_ENV=true
PORT=8080
DOMAIN=your-domain.com
JWT_SECRET=your-jwt-secret
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-database
```

### Database Setup
1. Create MariaDB database
2. Configure credentials in .env
3. Run migration: `npm run migrate`

## Development

### Admin System
Admin users must be created manually for security:
1. Generate password hash: `npm run hash-password`
2. Create admin user with SQL: `sql/create_admin_users.sql`
3. See `docs/ADMIN_SECURITY.md` for detailed instructions

### SSL Certificates
For HTTPS development:
```bash
cd ssl/
node generate-certs.js
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Input sanitization
- XSS protection
- SSL/TLS encryption
- Secure file uploads

## Deployment

### Plesk Deployment
1. Upload repository files
2. Create .env with production values
3. Install dependencies: `npm install --production`
4. Run migration: `npm run migrate`
5. Start application: `npm start`

### Required Files for Manual Upload
- `.env` (configured for production)

All other files are version controlled and deployed via Git.

## License

ISC License - Free for educational and personal use.
