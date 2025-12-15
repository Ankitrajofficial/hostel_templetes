const express = require('express');
const Student = require('../models/Student');
const { auth, isAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Building configuration
const BUILDING_CONFIG = {
    totalFloors: 8,
    roomsPerFloor: 20,
    liftSideRooms: 9,
    oppositeSideRooms: 11
};

// Generate room layout for a floor
function getFloorLayout(floorNumber) {
    const baseRoom = floorNumber * 100;
    return {
        floor: floorNumber,
        liftSide: {
            upper: [baseRoom + 1, baseRoom + 2],
            lower: [baseRoom + 3, baseRoom + 4, baseRoom + 5, baseRoom + 6, baseRoom + 7, baseRoom + 8, baseRoom + 9]
        },
        oppositeSide: {
            upper: [baseRoom + 10, baseRoom + 11, baseRoom + 12, baseRoom + 13, baseRoom + 14],
            lower: [baseRoom + 15, baseRoom + 16, baseRoom + 17, baseRoom + 18, baseRoom + 19, baseRoom + 20]
        }
    };
}

// ==========================================
// PUBLIC ENDPOINTS (No Auth Required)
// ==========================================

// @route   GET /api/rooms/availability
// @desc    Get room availability summary (public)
// @access  Public
router.get('/availability', async (req, res) => {
    try {
        // Get count of occupied rooms by type
        const students = await Student.find({ 
            status: 'active',
            roomNumber: { $exists: true, $ne: '' }
        });
        
        // Calculate stats
        const totalRooms = BUILDING_CONFIG.totalFloors * BUILDING_CONFIG.roomsPerFloor;
        const occupiedRooms = new Set(students.map(s => s.roomNumber)).size;
        const availableRooms = totalRooms - occupiedRooms;
        
        // Count by room type
        const roomTypeCounts = {
            single: { total: 40, occupied: 0 },
            single_balcony: { total: 40, occupied: 0 },
            double: { total: 40, occupied: 0 },
            double_balcony: { total: 40, occupied: 0 }
        };
        
        students.forEach(s => {
            if (s.roomType && roomTypeCounts[s.roomType]) {
                roomTypeCounts[s.roomType].occupied++;
            }
        });
        
        res.json({
            totalRooms,
            availableRooms,
            occupiedRooms,
            occupancyRate: Math.round((occupiedRooms / totalRooms) * 100),
            roomTypes: {
                single: { available: roomTypeCounts.single.total - roomTypeCounts.single.occupied },
                single_balcony: { available: roomTypeCounts.single_balcony.total - roomTypeCounts.single_balcony.occupied },
                double: { available: roomTypeCounts.double.total - roomTypeCounts.double.occupied },
                double_balcony: { available: roomTypeCounts.double_balcony.total - roomTypeCounts.double_balcony.occupied }
            }
        });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================================
// PRIVATE ENDPOINTS (Auth Required)
// ==========================================

// @route   GET /api/rooms/config
// @desc    Get building configuration
// @access  Private
router.get('/config', auth, async (req, res) => {
    try {
        const floors = [];
        for (let i = 1; i <= BUILDING_CONFIG.totalFloors; i++) {
            floors.push(getFloorLayout(i));
        }
        
        res.json({
            ...BUILDING_CONFIG,
            floors
        });
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/rooms/occupancy
// @desc    Get all room occupancy data
// @access  Private
router.get('/occupancy', auth, async (req, res) => {
    try {
        // Get all active students with room assignments
        const students = await Student.find({ 
            status: 'active',
            roomNumber: { $exists: true, $ne: '' }
        }).populate('userId', 'name phone');
        
        // Build occupancy map
        const occupancyMap = {};
        const roomDetails = {};
        
        students.forEach(student => {
            const room = student.roomNumber;
            if (!occupancyMap[room]) {
                occupancyMap[room] = {
                    count: 0,
                    roomType: student.roomType,
                    students: []
                };
            }
            occupancyMap[room].count++;
            occupancyMap[room].students.push({
                id: student._id,
                name: student.userId?.name || 'Unknown',
                phone: student.userId?.phone || '',
                coaching: student.coaching
            });
        });
        
        // Calculate stats
        const totalRooms = BUILDING_CONFIG.totalFloors * BUILDING_CONFIG.roomsPerFloor;
        const occupiedRooms = Object.keys(occupancyMap).length;
        const availableRooms = totalRooms - occupiedRooms;
        
        res.json({
            occupancy: occupancyMap,
            stats: {
                totalRooms,
                occupiedRooms,
                availableRooms,
                occupancyRate: Math.round((occupiedRooms / totalRooms) * 100)
            }
        });
    } catch (error) {
        console.error('Get occupancy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/rooms/floor/:floor
// @desc    Get specific floor occupancy
// @access  Private
router.get('/floor/:floor', auth, async (req, res) => {
    try {
        const floorNumber = parseInt(req.params.floor);
        
        if (floorNumber < 1 || floorNumber > BUILDING_CONFIG.totalFloors) {
            return res.status(400).json({ message: 'Invalid floor number' });
        }
        
        const layout = getFloorLayout(floorNumber);
        const allRooms = [
            ...layout.liftSide.upper,
            ...layout.liftSide.lower,
            ...layout.oppositeSide.upper,
            ...layout.oppositeSide.lower
        ];
        
        // Get students on this floor
        const students = await Student.find({
            status: 'active',
            roomNumber: { $in: allRooms.map(r => r.toString()) }
        }).populate('userId', 'name phone email');
        
        // Build room status
        const roomStatus = {};
        allRooms.forEach(room => {
            roomStatus[room] = {
                room: room,
                status: 'available',
                students: [],
                roomType: null
            };
        });
        
        students.forEach(student => {
            const room = student.roomNumber;
            if (roomStatus[room]) {
                roomStatus[room].students.push({
                    id: student._id,
                    name: student.userId?.name || 'Unknown',
                    phone: student.userId?.phone || '',
                    email: student.userId?.email || '',
                    coaching: student.coaching,
                    photoUrl: student.photoUrl
                });
                roomStatus[room].roomType = student.roomType;
                
                // Determine status based on room type and occupancy
                const isDouble = student.roomType?.includes('double');
                if (isDouble && roomStatus[room].students.length === 1) {
                    roomStatus[room].status = 'partial'; // One bed occupied in double room
                } else {
                    roomStatus[room].status = 'occupied';
                }
            }
        });
        
        res.json({
            floor: floorNumber,
            layout,
            rooms: roomStatus
        });
    } catch (error) {
        console.error('Get floor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
