/**
 * @typedef {Object} Driver
 * @property {string} id - Driver ID (e.g., "driver_01")
 * @property {string} name - Driver Name
 * @property {string} currentVehicle - Currently assigned vehicle ID/Name
 * @property {string} course - Default course name (e.g., "A-1")
 * @property {string} [color] - UI color class string (e.g., "bg-gray-50")
 * @property {string} [defaultCourse] - Original default course
 * @property {string} [defaultVehicle] - Original default vehicle
 */

/**
 * @typedef {Object} JobItem
 * @property {string} itemId - Item ID (UUID)
 * @property {string} name - Item Name
 * @property {string} unit - Unit (e.g., "kg")
 * @property {number} [expectedQuantity] - Expected quantity
 * @property {number} [actualQuantity] - Actual quantity
 */

/**
 * @typedef {Object} Job
 * @property {string} id - Job ID
 * @property {string} title - Job Title (Customer Name)
 * @property {string} driverId - Assigned Driver ID
 * @property {string} startTime - Start Time (HH:MM format)
 * @property {number} duration - Duration in minutes
 * @property {JobItem[]} [items] - List of items to collect
 * @property {string} [bucket] - "AM" | "PM" | "Free"
 * @property {boolean} [isSpot] - Is spot job?
 * @property {Object} [timeConstraint] - Time constraint details
 * @property {string} [timeConstraint.type] - "RANGE" | "FIXED"
 * @property {Object} [timeConstraint.range] - { start: string, end: string }
 * @property {string} [timeConstraint.fixed] - Fixed time string
 * @property {string} [taskType] - "collection" | "delivery" | "special"
 * @property {string} [vehicle_lock] - Locked vehicle ID
 * @property {string} [requiredVehicle] - Required vehicle ID
 * @property {boolean} [isVehicleError] - Validation state
 * @property {string} [originalCustomerId] - Reference to master customer ID
 * @property {string} [note] - Remarks
 * @property {string} [overrideReason] - Reason for constraint override
 */

/**
 * @typedef {Object} Split
 * @property {string} id - Split ID
 * @property {string} driverId - Driver ID
 * @property {string} time - Split Time (HH:MM)
 * @property {string} driverName - Name of driver taking over (or label)
 * @property {string} vehicle - Vehicle used after this split
 */

/**
 * @typedef {Object} BoardData
 * @property {Driver[]} drivers
 * @property {Job[]} jobs
 * @property {Job[]} pendingJobs
 * @property {Split[]} splits
 */

export const Types = {}; // Dummy export to make it a module
