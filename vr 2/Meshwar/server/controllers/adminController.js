import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Car from "../models/Car.js";


export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCars = await Car.countDocuments();
        const totalBookings = await Booking.countDocuments();

        const totalRevenueResult = await Booking.aggregate([
            { $match: { status: "confirmed" } },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyRevenueResult = await Booking.aggregate([
            { 
                $match: { 
                    status: "confirmed", 
                    createdAt: { $gte: startOfMonth } 
                } 
            },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

        // Updated this part to include more details

const recentBookings = await Booking.find()
    .populate('car')   // هنجيب كل بيانات العربية
    .populate('user')  // هنجيب كل بيانات العميل
    .populate('owner') // هنجيب كل بيانات المالك
    .sort({ createdAt: -1 })
    .limit(10);
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalCars,
                totalBookings,
                totalRevenue,
                monthlyRevenue,
                recentBookings
            }
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
};