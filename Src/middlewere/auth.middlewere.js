import jwt from 'jsonwebtoken';

export const authenticateUser = async (req, res, next) => {
  try {

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

   
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
       
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token expired" });
        }
        return res.status(403).json({ message: "Invalid token" });
      }

      
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
