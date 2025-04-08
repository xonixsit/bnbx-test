const jwt = require("jsonwebtoken");
const config = require("./../config/config");

module.exports.verifyJWTToken = (request, response, next) => {
    try {
        const token = request.headers.authorization;
        // console.log("Token:", token); // Debug logging
        if (!token) {
            return response.status(403).json({
                status: false,
                message: "Invalid token or expired!",
                data: null,
            });
        }

        jwt.verify(token, config.JWT_AUTH_TOKEN, async (err, result) => {
            if (err) {
                return response.status(401).json({
                    status: false,
                    message: "You are Not Authorized",
                    data: null,
                });
            }
            if (result) {
                // Set both request.user and request.body.user
                request.user = result;
                request.body.user = result;
                return next();
            }

            return response.status(401).json({
                status: false,
                message: "Invalid token or expired!",
                data: null,
            });
        });
    } catch (e) {
        console.error("JWT Error:", e);
        return response.status(500).json({
            status: false,
            message: "Invalid token or expired!",
            data: null,
        });
    }
};

module.exports.verifyJWTTokenSocket = (io) => {
    io.use((socket, next) => {
        try {
            let token = socket.handshake.headers.authorization;
            // console.log("Hello", token)
            if (!token) {
                socket.disconnect();
                return next(new Error("Invalid token or expired!"));
            } else {
                jwt.verify(token, config.JWT_AUTH_TOKEN, async (err, result) => {
                    if (err) {
                    socket.disconnect();
                    return next(new Error("You are not authorized"));
                    } else {
                    if (result) {
                        // Assign the updated payload to the request body
                        // socket.user = result;
                        UserModel.findOne({
                        _id: result._id,
                        })
                        .then((u) => {
                            if (!u) {
                            return next(new Error("Invalid token was provided"));
                            } else {
                            socket.user = u;
                            next();
                            }
                        })
                        .catch((e) => {
                            return next(new Error("Invalid token was provided"));
                        });
                        // return next();
                    } else {
                        socket.disconnect();
                        return next(new Error("Invalid token or expired!"));
                    }
                    }
                });
            }
        } catch (error) {
            console.log("error in socket auth:", error);
            socket.disconnect();
            return next(new Error(error));
        }
    });
};

const verifyJWTToken = (req, res, next) => {
  console.log('Auth Header:', req.headers.authorization); // Debug log
  
  try {
    const token = req.headers.authorization;
    if (!token) {
      console.log('No token provided'); // Debug log
      return res.status(401).json({ message: "Access Denied" });
    }

    // If token exists, verify it
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verification result:', verified); // Debug log
    
    req.user = verified;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error); // Debug log
    res.status(401).json({ message: "Invalid Token" });
  }
};
