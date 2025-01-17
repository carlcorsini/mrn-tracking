import React, { useState } from 'react';
import { Switch, Route } from 'react-router-dom';
import { compose } from 'recompose';
// import Box from '@material-ui/core/Box';
// import Link from '@material-ui/core/Link';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withAuthorization, withEmailVerification } from '../Session';
import { UserList, UserItem } from '../Users';
import AdminTable from './AdminTable';
import * as ROLES from '../../constants/roles';
import * as ROUTES from '../../constants/routes';
import { AuthUserContext } from '../Session';
import { withFirebase } from '../Firebase';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    marginBottom: '1em',
    marginTop: '1em',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
}));

const AdminPage = ({ firebase }) => {
  const classes = useStyles();
  const [activities, setActivities] = useState([]);
  const [given, setGiven] = useState([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(92);
  const [qbr, setQBR] = useState(undefined);

  const onListenForGiven = (uid) => {
    setLoading(true);
    if (uid === 'all_members_quarterly') {
      setGiven([]);
      setLoading(false);
    } else {
      firebase
        .activities()
        .orderByChild('member_id')
        .equalTo(uid)
        .on('value', async (snapshot) => {
          const activityObject2 = snapshot.val();
          if (await activityObject2) {
            const activityList2 = Object.keys(activityObject2).map(
              (uid) => ({
                ...activityObject2[uid],
                uid,
              }),
            );
            const givenList = activityList2.map((obj) => {
              if (obj.activityType === 'Business Received') {
                return {
                  ...obj,
                  activityType: 'Business Given',
                };
              } else if (obj.activityType === 'Referral Given') {
                return {
                  ...obj,
                  activityType: 'Referral Received',
                };
              } else {
                return obj;
              }
            });
            setGiven(givenList);
            setLoading(false);
          } else {
            setGiven([]);
            setLoading(false);
          }
        });
    }
  };

  const onListenForActivity = (uid, dateRange) => {
    setLoading(true);
    if (uid === 'all_members_quarterly') {
      let otherDay = new Date();
      otherDay.setDate(otherDay.getDate() - days);
      let qb = Math.round(otherDay.getTime() / 1000);
      firebase
        .activities()
        .orderByChild('date_timestamp')
        .startAt(qb)
        .on('value', (snapshot) => {
          const activityObject = snapshot.val();

          if (activityObject) {
            const activityList = Object.keys(activityObject).map(
              (uid) => ({
                ...activityObject[uid],
                uid,
              }),
            );

            setActivities(activityList);
            setLoading(false);
          } else {
            setActivities([]);
            setLoading(false);
          }
        });
    } else if (uid === 'all_members') {
      firebase.activities().on('value', (snapshot) => {
        const activityObject = snapshot.val();

        if (activityObject) {
          const activityList = Object.keys(activityObject).map(
            (uid) => ({
              ...activityObject[uid],
              uid,
            }),
          );

          setActivities(activityList);
          setLoading(false);
        } else {
          setActivities([]);
          setLoading(false);
        }
      });
    } else {
      firebase
        .activities()
        .orderByChild('userId')
        .equalTo(uid)
        .on('value', (snapshot) => {
          const activityObject = snapshot.val();

          if (activityObject) {
            const activityList = Object.keys(activityObject).map(
              (uid) => ({
                ...activityObject[uid],
                uid,
              }),
            );
            setActivities(activityList);
            setLoading(false);
          } else {
            setActivities([]);
            setLoading(false);
          }
        });
    }
  };

  const userList = (
    <Switch>
      <div className={classes.root}>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography className={classes.heading}>
              Users List
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Route
              exact
              path={ROUTES.ADMIN_DETAILS}
              component={UserItem}
            />
            <Route exact path={ROUTES.ADMIN} component={UserList} />
          </AccordionDetails>
        </Accordion>
      </div>
    </Switch>
  );

  return (
    <AuthUserContext.Consumer>
      {(authUser) => (
        <Container>
          <AdminTable
            setLoading={setLoading}
            loading={loading}
            authUser={authUser}
            onListenForActivity={onListenForActivity}
            onListenForGiven={onListenForGiven}
            activities={activities}
            setActivities={setActivities}
            days={days}
            setDays={setDays}
            given={given}
            userList={userList}
          />
        </Container>
      )}
    </AuthUserContext.Consumer>
  );
};

const condition = (authUser) =>
  authUser && !!authUser.roles[ROLES.ADMIN];

export default compose(
  withEmailVerification,
  withAuthorization(condition),
)(withFirebase(AdminPage));
