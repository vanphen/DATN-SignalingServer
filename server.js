const io = require('socket.io')(9000);
//Knect connect sql
var knex = require('knex')({
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      port: '3306',
      user : 'root',
      password : '',
      database : 'tlurtc'
    }
});
var sha1 = require('sha1');
var rooms = {};
var listCustomer = {};
var listEmployee = {};

io.on('connection', (socket) => {
  console.log(socket.id);
  socket.on('them_thanh_vien', function(username, inforuser = null){
    //   console.log(inforuser)
      let nameRoom = sha1(socket.id+''+Math.random()).slice(0,8);
      let idUserConnect = socket.id;
      if (inforuser['nameGroup']) {
          nameRoom = inforuser['nameGroup'];
      }

      rooms[idUserConnect] = {'nameRoom': nameRoom, 'username' : username, 'inforUser' : inforuser};
      socket.join(nameRoom);

      knex.select('id').from('zooms').then((result) => {
            var resultArray = Object.values(JSON.parse(JSON.stringify(result)))
            let checkIdZoom = true;
            for(idzoom in resultArray) {
                if (resultArray[idzoom].id  === nameRoom) {
                    checkIdZoom = false;
                }
            }
            if (checkIdZoom) {
                knex('zooms').returning('id').insert({id: nameRoom}).then(() => { });
            }
            socket.emit('thong_bao', 'SERVER hien tai :', socket.id, JSON.stringify(rooms));
            // Hiển thị thông báo cho các thanh viên khác
            socket.broadcast.emit('thong_bao_employee', 'SERVER', socket.id, JSON.stringify(rooms));
      })
    //   console.log(2222222222,rooms)
  });

  socket.on('joinGroup', function(nameGroup) {
      socket.join(nameGroup);
  })

  socket.on('employee', function(){
      socket.emit('thong_bao', 'SERVER', socket.id, JSON.stringify(rooms));
  });

  socket.on('new_message', function(object_message) {
      let newmessage = JSON.parse(object_message);
      io.to(newmessage.nameRoom).emit('my_message', object_message);
      let dateCurrent = new Date();
      let dateTime = dateCurrent.getTime();
      knex('messages').insert({
          content: newmessage.message, 
          user_id: newmessage.userID, 
          zoom_id: newmessage.nameRoom, 
          created_at : dateTime
      }).then((result) => {});
  })

  socket.on('get_message_zooms', function(zommID) {
    knex('zooms')
    .join('messages', 'zooms.id', '=', 'messages.zoom_id')
    .where('zooms.id', zommID)
    .orderBy('messages.id')
    .select('*').then((result) =>{
        let resultArray = Object.values(JSON.parse(JSON.stringify(result)))
        socket.emit('get_message_zoom', JSON.stringify(resultArray));
    })
  })

  socket.on('new_call', function(object_new_call) {
        new_call = JSON.parse(object_new_call);
        // new_call = object_new_call;
        io.to(new_call.nameRoom).emit('new_call', object_new_call);
  })

  socket.on('send_offer', function(object_send_offer) {
        send_offer = JSON.parse(object_send_offer);
        // send_offer = object_send_offer;
        io.to(send_offer.nameRoom).emit('send_offer' , object_send_offer);
  })

  socket.on('send_answer', function(object_send_answer) {
      send_answer = JSON.parse(object_send_answer);
    //   send_answer = object_send_answer;
      io.to(send_answer.nameRoom).emit('send_answer' , object_send_answer);
  })

  socket.on('send_candidate', function(object_send_candidate) {
    send_candidate = JSON.parse(object_send_candidate);
    // send_candidate = object_send_candidate;
    io.to(send_candidate.nameRoom).emit('send_candidate' , object_send_candidate);
  })

  // lang nghe dang ki tu van
  socket.on('register_customer', function(object_customer) {
    let customer = JSON.parse(object_customer);
    let dateCurrent = new Date();
    knex('customers').insert({
        name: customer.name, 
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        ip: customer.ip,
        message: customer.content,
        status: 0,
        created_at : dateCurrent,
        updated_at : dateCurrent
    }).then((result) => {});
  })

  socket.on('disconnect', function(){
      delete rooms[socket.id]
    //   console.log(socket.id + ' disconnect');
    //   console.log(111111,rooms);
      socket.broadcast.emit('thong_bao_employee', 'Disconnected', socket.id, JSON.stringify(rooms));
  });

});