<?php

/** DB STRUCT
 * 
 * sessions
 * 
 * id
 * userid
 * expires
 * 
 * users
 * 
 * id
 * username
 * email
 * password
 * flags
 * 
 * */
/** DB STRUCT EXAMPLES
 * 
 * sessions
 * 
 * id           9f9052c18ea57e0b1d39c15223451845
 * user_id      1
 * expires      1381331512
 * 
 * users
 * 
 * id           1
 * username     JBud
 * email        jbudorg@gmail.com
 * password     96b527f6ed33fe4458c193a8619c8827
 * flags        3
 * 
 * */

$SECURE_HASH = "_PORTAL2_SECUR_HASH_";

function db_cleanSessions(){
    $database = new database;
    $q = $database->query("DELETE FROM sessions WHERE expires < ".time());
    return $q;
}

function db_getCurrentSessions(){
    $database = new database;
    $q = $database->query("SELECT id FROM sessions WHERE expires > ".time(),"FULL");
    return $q;
}

function db_getSession($session_id){
    $database = new database;
    $q = $database->query("SELECT * FROM sessions WHERE id = '".$session_id."'","ROW");
    return $q;
}

function isSessionExpired($session_id){
    $session = db_getSession($session_id);
    if (!$session)
        return -1;
    
    if (time() > $session['expires'])
        return true; // The session IS expired.
    else return false;
}

function db_addSession($session_id, $user_id, $expires){
    $database = new database;
    $q = $database->query("INSERT INTO sessions (id, userid, expires) VALUES ('$session_id', '$user_id', '$expires')");
    return $q;
}

function getSession(){
    db_cleanSessions();
    $cookie = $_COOKIE["portal2Session"];
    debug($cookie);
    return db_getSession($cookie);
}

function setSession($user_id, $longsess = false){
    global $SECURE_HASH;
    $session_id = md5($user_id.$SECURE_HASH.time()); // Example: 9f9052c18ea57e0b1d39c15223451845
    $expire = ($longsess)? time() + 2592000 : time() + 86400; // 24 hours ( 30 days for longsess )
    
    setcookie("portal2Session", $session_id, $expire, "/");
    
    return db_addSession($session_id, $user_id, $expire);
}

function db_killSession($session_id){
    $database = new database;
    $q = $database->query("DELETE FROM sessions WHERE id='$session_id'");
    return $q;
}

function killSession(){
    $session = getSession();
    $session_id = $session['id'];
    setcookie("portal2Session", "", time()-30, "/");
    
    return db_killSession($session_id);
}

function getUserById($user_id){
    $database = new database;
    $q = $database->query("SELECT * FROM users WHERE id = ".$user_id,"ROW");
    return $q;
}


function generatePassHash($pass, $user){
    global $SECURE_HASH;
    return md5($SECURE_HASH.strtoupper($user)."_".$pass); // Lets use a secure hash to prevent reverse md5 in case of security breach.
}

function login($user, $pass, $long = false){ // User or Email, Password, 30day session?.
    $database = new database;
    $q = $database->query("SELECT * FROM users WHERE email = '".$user."'","ROW"); // Lets check email first.
    if (!$q){
        $q = $database->query("SELECT * FROM users WHERE username = '".$user."'","ROW"); // Now we'll check usernames.
        if (!$q){
            return -1; // Failed to find username/email.
        }
    }
    $db_pass = $q['password'];
    $db_user = $q['username'];
    $loginpass = generatePassHash($pass,$db_user);
    
    //debug("Password: $pass ; Username: $db_user ; loginpass: $loginpass ; db_pass = $db_pass");
    if ($db_pass != $loginpass){
        return -2; // Password match failed.
    } 
    else{
        return setSession($q['id'],$long);
    }
}

/* flags:
 * 1 - User
 * 2 - Editor
 * 3 - Admin
 * 
 * Return values:
 * Any Positive number = User ID.
 * -1 = Email Exists.
 * -2 = User Exists.
 * -3 = Add User Failed. (Unknown database insertion Error)
 * -4 = Unable to Find User ID. (Unknown database corruption Error)
 * 
 * */
function setUser($username, $email, $password, $flags = 1){
    $password = generateHashPass($password, $username);
    $database = new database;
    $q = $database->query("SELECT email FROM users WHERE email = ".$email,"ROW");
    if (!$q){ // Email doesn't exist, continue...
        $q = $database->query("SELECT username FROM users WHERE username = ".$username,"ROW");
        if (!$q){ // Username doesn't exist, continue...
            $q = $database->query("INSERT INTO users (username, email, password, flags)". 
                                            "VALUES ('$username', '$email', '$password', '$flags')"
            );
            if (!$q){
                return -3; // Couldn't add user, exit
            }
            else{ // Insertion complete, continue...
                $q = $database->query("SELECT id FROM users WHERE username = ".$username,"ROW");
                if ($q !== false && !empty($q)){ // ID Found, continue...
                    $user_id = $q['id'];
                }
                else return -4; // Couldn't find added user, exit
            }
        }
        else return -2;  // Couldn't add user, (Error: Username Exists), exit
    }
    else return -1; // Couldn't add user (Error: Email Exists), exit
    
    return $user_id;
}


?>