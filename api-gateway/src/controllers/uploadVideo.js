

const uploadtos3 = async (req, res) => {
    
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  res.status(200).json({ fileName: req.fileName, message: 'File uploaded successfully' });
};

export { uploadtos3 };
