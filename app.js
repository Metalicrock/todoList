//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://todaro-admin:QHL4efXeGw57JkDc@cluster0.r6w0eia.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const newTodo = new Item({
  name: "Welcome to your todo list!"
});
const newTodo2 = new Item({
  name: "Hit the + button to add a new item."
});
const newTodo3 = new Item({
  name: "<---- Hit this to delete and item."
});

const defaultItems = [newTodo, newTodo2, newTodo3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
 
  Item.find({})
  .then(foundItem => {
    if (foundItem.length === 0) {
      return Item.insertMany(defaultItems);
    } else {
      return foundItem;
    }
  })
  .then(savedItem => {
    res.render("list", {
      listTitle: "Today",
      newListItems: savedItem
    });
  })
  .catch(err => console.log(err));

});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
 
  List.findOne({name:customListName})
    .then(function(foundList){
        
          if(!foundList){
            const list = new List({
              name:customListName,
              items:defaultItems
            });
          
            list.save();
            console.log("saved");
            res.redirect("/"+customListName);
          }
          else{
            res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
          }
    })
    .catch(function(err){});
 
 
  
  
})




app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });


  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
      .then(function(foundList){
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/"+listName);
      });
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

if(listName === "Today"){
  await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/")
} else {
  await List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}})
  .then(function(foundList){
    res.redirect("/"+listName);
  })
}

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
