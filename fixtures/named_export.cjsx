React = require('react')

testConstant = 'foo'

klass = React.createClass({
  render: ->
    <div className="hello">
      <div>Hello</div>
    </div>
})

module.exports.named = klass

