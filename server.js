const express = require('express');
var whois = require('whois')
var exec = require('child_process').exec;
const app = express()


app.use(express.static('public'))


app.get('/whois', function(req, res,next) {
	var cmd = 'whois '+req.query.domain;
	exec(cmd, function (err, stdout, stderr) {
	    if(!err){
			//var response = stdout.replace("Expires On: ","");
			res.send(stdout);
	    }else{
	    	res.status(500).json({ error: err });
	    }
  })
});

app.listen(3000, () => console.log('Example app listening on port 3000!'))