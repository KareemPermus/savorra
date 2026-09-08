query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
   cursor.execute(query, (username.strip(), password))
