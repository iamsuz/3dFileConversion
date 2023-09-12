const initialize = (req, res) => {
    try {
        // Initialize a 3d file and return the object
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: 'INTERNAL ERROR'
        })
    }
}